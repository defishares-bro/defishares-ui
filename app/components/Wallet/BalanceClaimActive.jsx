import React, {Component} from "react";
import {connect} from "alt-react";
import Immutable from "immutable";
import cname from "classnames";
import counterpart from "counterpart";
import {ChainStore, FetchChain} from "bitsharesjs";

import LoadingIndicator from "components/LoadingIndicator";
import PrivateKeyStore from "stores/PrivateKeyStore";
import AccountRefsStore from "stores/AccountRefsStore";
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions";
import {Input} from "bitshares-ui-style-guide";
import BalanceClaimSelector from "components/Wallet/BalanceClaimSelector";
import WalletActions from "actions/WalletActions";
import {
    getBalanceClaimSignerErrors,
    getMissingActiveAuthority
} from "../../lib/chain/BalanceClaim";
import MyAccounts from "components/Forms/MyAccounts";
import Translate from "react-translate-component";
import {Notification} from "bitshares-ui-style-guide";

class BalanceClaimActive extends Component {
    constructor(props) {
        super(props);
        this.state = {
            targetAccountName: "",
            targetAccount: null,
            targetAccountError: null,
            validatingTargetAccount: false,
            claiming: false
        };
        this.targetLookupTimer = null;
        this.targetLookupVersion = 0;
    }

    componentWillUnmount() {
        this.targetLookupVersion += 1;
        if (this.targetLookupTimer) clearTimeout(this.targetLookupTimer);
        this.targetLookupTimer = null;
    }

    UNSAFE_componentWillMount() {
        let keys = PrivateKeyStore.getState().keys;
        let keySeq = keys.keySeq();
        BalanceClaimActiveActions.setPubkeys(keySeq);
        this.existing_keys = keySeq;
    }

    UNSAFE_componentWillReceiveProps() {
        let keys = PrivateKeyStore.getState().keys;
        let keySeq = keys.keySeq();
        if (!keySeq.equals(this.existing_keys)) {
            this.existing_keys = keySeq;
            BalanceClaimActiveActions.setPubkeys(keySeq);
        }
    }

    render() {
        if (this.props.loading) {
            return (
                <div>
                    <br />
                    <h5>
                        <Translate content="wallet.loading_balances" />
                        &hellip;
                    </h5>
                    <br />
                    <LoadingIndicator type="three-bounce" />
                </div>
            );
        }

        if (!this.props.balances || !this.props.balances.size) {
            return (
                <div>
                    <br />
                    <h5>
                        <Translate content="wallet.no_balance" />
                    </h5>
                </div>
            );
        }

        const targetAccountReady = this.props.account_refs.size
            ? !!this.props.claim_account_name
            : !!this.state.targetAccount;
        let import_ready =
            this.props.selected_balances.size && targetAccountReady;
        let claim_balance_label = import_ready
            ? ` (${this.getTargetAccountName()})`
            : null;

        return (
            <div translate="no">
                <div className="content-block center-content">
                    <h3 className="no-border-bottom">
                        <Translate content="wallet.claim_balances" />
                    </h3>
                </div>
                <div className="grid-block vertical">
                    <div
                        className="grid-content"
                        style={{overflowY: "hidden !important"}}
                    >
                        {this.props.account_refs.size ? (
                            <div className="full-width-content center-content">
                                <MyAccounts
                                    key={this.props.balances}
                                    accounts={Immutable.List(
                                        this.props.account_refs
                                    )}
                                    onChange={this.onClaimAccountChange.bind(
                                        this
                                    )}
                                />
                            </div>
                        ) : (
                            <div className="full-width-content" translate="no">
                                <p>
                                    {counterpart.translate(
                                        "wallet.claim_target_account_unlinked"
                                    )}
                                </p>
                                <Input
                                    data-testid="claim-target-account"
                                    value={this.state.targetAccountName}
                                    onChange={this.onTargetAccountChange.bind(
                                        this
                                    )}
                                    placeholder={counterpart.translate(
                                        "wallet.claim_target_account_placeholder"
                                    )}
                                />
                                <p
                                    className={cname({
                                        "header-selector--error": !!this.state
                                            .targetAccountError
                                    })}
                                    aria-live="polite"
                                >
                                    {this.getTargetAccountStatus()}
                                </p>
                            </div>
                        )}
                        <br />
                    </div>
                    <br />
                    <BalanceClaimSelector />
                </div>
                <br />
                <br />
                <div
                    className={cname("button success", {
                        disabled: !import_ready || this.state.claiming
                    })}
                    onClick={this.onClaimBalance.bind(this)}
                >
                    <Translate
                        content={
                            this.state.claiming
                                ? "wallet.claiming"
                                : "wallet.claim_balance"
                        }
                    />
                    {claim_balance_label}
                </div>
                <div className="button cancel" onClick={this.onBack.bind(this)}>
                    <Translate content="wallet.cancel" />
                </div>
            </div>
        );
    }

    onBack(e) {
        e.preventDefault();
        window.history.back();
    }

    onClaimAccountChange(claim_account_name) {
        BalanceClaimActiveActions.claimAccountChange(claim_account_name);
    }

    getTargetAccountName() {
        return this.props.account_refs.size
            ? this.props.claim_account_name
            : this.state.targetAccount && this.state.targetAccount.get("name");
    }

    getTargetAccountStatus() {
        if (this.state.validatingTargetAccount)
            return counterpart.translate("wallet.claim_target_account_loading");
        if (this.state.targetAccount)
            return counterpart.translate(
                "wallet.claim_target_account_confirmed",
                {account_id: this.state.targetAccount.get("id")}
            );
        return this.state.targetAccountError || "";
    }

    onTargetAccountChange(event) {
        const accountName = (event.target.value || "").trim().toLowerCase();
        const lookupVersion = ++this.targetLookupVersion;
        if (this.targetLookupTimer) clearTimeout(this.targetLookupTimer);
        this.targetLookupTimer = null;
        if (this.props.claim_account_name)
            BalanceClaimActiveActions.claimAccountChange(undefined);
        this.setState({
            targetAccountName: accountName,
            targetAccount: null,
            targetAccountError: null,
            validatingTargetAccount: !!accountName
        });

        if (!accountName) return;

        this.targetLookupTimer = setTimeout(() => {
            this.targetLookupTimer = null;
            Promise.resolve()
                .then(() => FetchChain("getAccount", accountName))
                .then(account => {
                    if (
                        lookupVersion !== this.targetLookupVersion ||
                        this.state.targetAccountName !== accountName
                    )
                        return;
                    if (!account) {
                        this.setState({
                            validatingTargetAccount: false,
                            targetAccountError: counterpart.translate(
                                "wallet.claim_target_account_invalid"
                            )
                        });
                        return;
                    }
                    BalanceClaimActiveActions.claimAccountChange(accountName);
                    this.setState({
                        validatingTargetAccount: false,
                        targetAccount: account,
                        targetAccountError: null
                    });
                })
                .catch(() => {
                    if (
                        lookupVersion !== this.targetLookupVersion ||
                        this.state.targetAccountName !== accountName
                    )
                        return;
                    this.setState({
                        validatingTargetAccount: false,
                        targetAccountError: counterpart.translate(
                            "wallet.claim_target_account_invalid"
                        )
                    });
                });
        }, 300);
    }

    onClaimBalance() {
        if (
            this.state.claiming ||
            !this.props.selected_balances.size ||
            !this.getTargetAccountName() ||
            (!this.props.account_refs.size && !this.state.targetAccount)
        )
            return;

        const accountName = this.getTargetAccountName();
        this.setState({claiming: true});
        WalletActions.importBalance(
            accountName,
            this.props.selected_balances,
            true //broadcast
        )
            .then(() => {
                this.setState({claiming: false});
                if (this.state.targetAccount) {
                    ChainStore.requestAllDataForAccount(
                        this.state.targetAccount.get("id"),
                        "balance"
                    );
                }
                return BalanceClaimActiveStore.refreshBalances();
            })
            .catch(error => {
                console.error("claimBalance", error);
                let message = error;
                const signerErrors = getBalanceClaimSignerErrors(error);
                const missingAuthority = getMissingActiveAuthority(error);
                if (signerErrors) {
                    message = signerErrors
                        .map(
                            signerError =>
                                `${
                                    signerError.public_key
                                }: ${counterpart.translate(
                                    `notifications.balance_claim_signer_${signerError.reason}`
                                )}`
                        )
                        .join("; ");
                } else if (missingAuthority) {
                    message = counterpart.translate(
                        "notifications.balance_claim_missing_active_authority",
                        {
                            account_id: missingAuthority.account_id,
                            public_key: missingAuthority.public_keys.join(", ")
                        }
                    );
                } else if (error && error.data && error.data.message) {
                    message = error.data.message;
                } else if (error && error.message) {
                    message = error.message;
                }
                this.setState({claiming: false});
                Notification.error({
                    message: counterpart.translate(
                        "notifications.balance_claim_error",
                        {
                            error_msg: message
                        }
                    )
                });
            });
    }
}

BalanceClaimActive = connect(BalanceClaimActive, {
    listenTo() {
        return [BalanceClaimActiveStore, AccountRefsStore, PrivateKeyStore];
    },
    getProps() {
        let props = BalanceClaimActiveStore.getState();
        props.account_refs = AccountRefsStore.getAccountRefs();
        return props;
    }
});

export default BalanceClaimActive;
