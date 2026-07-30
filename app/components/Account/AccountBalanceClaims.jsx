import React from "react";
import {connect} from "alt-react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {Button} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";

import FormattedAsset from "components/Utility/FormattedAsset";
import LoadingIndicator from "components/LoadingIndicator";
import PrivateKeyStore from "stores/PrivateKeyStore";
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions";
import WalletActions from "actions/WalletActions";
import {getBalanceClaimSignerErrors} from "../../lib/chain/BalanceClaim";

class AccountBalanceClaims extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            claiming: null,
            error: null
        };
        this.existing_keys = Immutable.Seq();
    }

    componentDidMount() {
        this.syncKeys();
    }

    componentDidUpdate() {
        const keys = PrivateKeyStore.getState().keys.keySeq();
        if (!keys.equals(this.existing_keys)) this.syncKeys();
    }

    syncKeys() {
        const keys = PrivateKeyStore.getState().keys.keySeq();
        this.existing_keys = keys;
        BalanceClaimActiveActions.setPubkeys(keys);
    }

    getBalances() {
        const {balances, address_to_pubkey} = this.props;
        if (!balances) return [];

        return balances
            .filter(balance => {
                return (
                    balance &&
                    balance.balance &&
                    Number(balance.balance.amount) > 0 &&
                    !!address_to_pubkey.get(balance.owner)
                );
            })
            .map(balance => ({
                ...balance,
                public_key_string: address_to_pubkey.get(balance.owner)
            }))
            .toArray();
    }

    claimBalances(balances) {
        if (this.state.claiming || !balances.length) return;

        this.setState({
            claiming: balances.map(balance => balance.id),
            error: null
        });
        WalletActions.importBalance(this.props.accountId, balances, true)
            .then(() => {
                ChainStore.requestAllDataForAccount(
                    this.props.accountId,
                    "balance"
                );
                return BalanceClaimActiveStore.refreshBalances();
            })
            .then(() => {
                this.setState({claiming: null});
            })
            .catch(error => {
                this.setState({
                    claiming: null,
                    error: error || new Error("Balance claim failed")
                });
            });
    }

    render() {
        const {loading, error: lookupError} = this.props;
        const balances = this.getBalances();
        const error = this.state.error || lookupError;
        const signerErrors = getBalanceClaimSignerErrors(error);
        const errorMessage = signerErrors
            ? signerErrors
                  .map(
                      signerError =>
                          `${signerError.public_key}: ${counterpart.translate(
                              `notifications.balance_claim_signer_${signerError.reason}`
                          )}`
                  )
                  .join("; ")
            : error && (error.message || String(error));

        return (
            <div className="content-block" style={{marginTop: 30}}>
                <Translate
                    component="h2"
                    content="account.vesting.address_claim_title"
                />
                <Translate
                    component="p"
                    content="account.vesting.address_claim_explain"
                />

                {loading ? (
                    <div className="center-content">
                        <Translate content="account.vesting.address_claim_loading" />
                        <LoadingIndicator type="circle" />
                    </div>
                ) : null}

                {error ? (
                    <p className="header-selector--error">
                        {counterpart.translate(
                            "account.vesting.address_claim_error",
                            {
                                error: errorMessage
                            }
                        )}
                    </p>
                ) : null}

                {!loading && !error && !balances.length ? (
                    <p>
                        <Translate content="account.vesting.address_claim_none" />
                    </p>
                ) : null}

                {balances.length ? (
                    <div>
                        <div style={{marginBottom: 12}}>
                            <Button
                                type="secondary"
                                disabled={!!this.state.claiming}
                                onClick={() => this.claimBalances(balances)}
                            >
                                <Translate content="account.vesting.address_claim_all" />
                            </Button>
                        </div>
                        <div style={{overflowX: "auto"}}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>
                                            <Translate content="account.vesting.address_claim_object" />
                                        </th>
                                        <th>
                                            <Translate content="account.vesting.address_claim_owner" />
                                        </th>
                                        <th style={{textAlign: "right"}}>
                                            <Translate content="account.vesting.address_claim_amount" />
                                        </th>
                                        <th style={{textAlign: "center"}}>
                                            <Translate content="account.vesting.address_claim_action" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {balances.map(balance => {
                                        const claiming =
                                            this.state.claiming &&
                                            this.state.claiming.indexOf(
                                                balance.id
                                            ) !== -1;
                                        return (
                                            <tr key={balance.id}>
                                                <td>{balance.id}</td>
                                                <td>{balance.owner}</td>
                                                <td
                                                    style={{textAlign: "right"}}
                                                >
                                                    <FormattedAsset
                                                        amount={
                                                            balance.balance
                                                                .amount
                                                        }
                                                        asset={
                                                            balance.balance
                                                                .asset_id
                                                        }
                                                    />
                                                </td>
                                                <td
                                                    style={{
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    <Button
                                                        type="secondary"
                                                        disabled={
                                                            !!this.state
                                                                .claiming
                                                        }
                                                        onClick={() =>
                                                            this.claimBalances([
                                                                balance
                                                            ])
                                                        }
                                                    >
                                                        {claiming ? (
                                                            <Translate content="account.vesting.address_claiming" />
                                                        ) : (
                                                            <Translate content="account.vesting.address_claim_action" />
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }
}

export default connect(AccountBalanceClaims, {
    listenTo() {
        return [BalanceClaimActiveStore, PrivateKeyStore];
    },
    getProps() {
        return BalanceClaimActiveStore.getState();
    }
});
