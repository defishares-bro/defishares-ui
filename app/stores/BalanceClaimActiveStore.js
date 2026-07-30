import alt from "alt-instance";
import Immutable from "immutable";
import BaseStore from "stores/BaseStore";
import {key} from "bitsharesjs";
import {Apis} from "bitsharesjs-ws";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions";
import TransactionConfirmActions from "actions/TransactionConfirmActions";

class BalanceClaimActiveStore extends BaseStore {
    constructor() {
        super();
        this.state = this._getInitialState();
        this._export("reset", "refreshBalances");
        // ChainStore.subscribe(this.chainStoreUpdate.bind(this))
        this.bindListeners({
            onSetPubkeys: BalanceClaimActiveActions.setPubkeys,
            onSetSelectedBalanceClaims:
                BalanceClaimActiveActions.setSelectedBalanceClaims,
            onClaimAccountChange: BalanceClaimActiveActions.claimAccountChange,
            onTransactionBroadcasted: TransactionConfirmActions.wasBroadcast
        });
    }

    _getInitialState() {
        // reset for each wallet
        this.pubkeys = null;
        this.addresses = new Set();
        var state = this.getInitialViewState();
        state.address_to_pubkey = new Map();
        return state;
    }

    getInitialViewState() {
        // reset in-between balance claims
        return {
            balances: undefined,
            checked: Immutable.Map(),
            selected_balances: Immutable.Seq(),
            claim_account_name: undefined,
            loading: true,
            error: null
        };
    }

    /** Reset for each wallet load or change */
    reset() {
        this.setState(this._getInitialState());
    }

    // onImportBalance() {
    //     // Imorted balance just ran, not included in the blockchain yet
    //     this.setState(this.getInitialViewState())
    // }

    onTransactionBroadcasted() {
        // Balance claims are included in a block...
        // chainStoreUpdate did not include removal of balance claim objects
        // This is a hack to refresh balance claims after a transaction.
        this.refreshBalances();
    }

    // chainStoreUpdate did not include removal of balance claim objects
    // chainStoreUpdate() {
    //     if(this.balance_objects_by_address !== ChainStore.balance_objects_by_address) {
    //         console.log("ChainStore.balance_objects_by_address")
    //         this.balance_objects_by_address = ChainStore.balance_objects_by_address
    //     }
    // }

    // param: Immutable Seq or array
    onSetPubkeys(pubkeys) {
        if (Array.isArray(pubkeys)) pubkeys = Immutable.Seq(pubkeys);
        if (this.pubkeys && this.pubkeys.equals(pubkeys)) return;
        this.reset();
        this.pubkeys = pubkeys;
        if (pubkeys.size === 0) {
            this.setState({loading: false});
            return true;
        }
        this.setState({loading: true});
        this.indexPubkeys(pubkeys);
        this.refreshBalances().catch(error => console.error(error));
    }

    onSetSelectedBalanceClaims(checked) {
        var selected_balances = checked
            .valueSeq()
            .flatten()
            .toSet();
        this.setState({checked, selected_balances});
    }

    onClaimAccountChange(claim_account_name) {
        this.setState({claim_account_name});
    }

    indexPubkeys(pubkeys) {
        let {address_to_pubkey} = this.state;

        for (let pubkey of pubkeys) {
            for (let address_string of key.addresses(pubkey)) {
                // AddressIndex indexes all addresses. Initial balance objects
                // are owned by these addresses, not by an account.
                address_to_pubkey.set(address_string, pubkey);
                this.addresses.add(address_string);
            }
        }
        this.setState({address_to_pubkey: address_to_pubkey});
    }

    indexPubkey(pubkey) {
        for (let address_string of key.addresses(pubkey)) {
            this.state.address_to_pubkey.set(address_string, pubkey);
            this.addresses.add(address_string);
        }
        this.setState({address_to_pubkey: this.state.address_to_pubkey});
    }

    refreshBalances() {
        return this.lookupBalanceObjects()
            .then(balances => {
                var state = this.getInitialViewState();
                state.balances = balances;
                state.loading = false;
                state.error = null;
                this.setState(state);
                return balances;
            })
            .catch(error => {
                this.setState({
                    balances: Immutable.List(),
                    loading: false,
                    error
                });
                throw error;
            });
    }

    /** @return Promise.resolve(balances) */
    lookupBalanceObjects() {
        var db = Apis.instance().db_api();
        if (!this.addresses.size) return Promise.resolve(Immutable.List());

        return db
            .exec("get_balance_objects", [Array.from(this.addresses)])
            .then(result => {
                var balance_ids = [];
                for (let balance of result) {
                    if (balance.vesting_policy) balance_ids.push(balance.id);
                }

                const loadVestedBalances = balance_ids.length
                    ? db.exec("get_vested_balances", [balance_ids])
                    : Promise.resolve([]);

                return loadVestedBalances.then(vested_balances => {
                    let vestedById = new Map();
                    balance_ids.forEach((id, index) => {
                        vestedById.set(id, vested_balances[index]);
                    });

                    return Immutable.List().withMutations(balance_list => {
                        for (let balance of result) {
                            if (balance.vesting_policy) {
                                balance.vested_balance = vestedById.get(
                                    balance.id
                                );
                            }
                            balance_list.push(balance);
                        }
                    });
                });
            });
    }
}

export var BalanceClaimActiveStoreWrapped = alt.createStore(
    BalanceClaimActiveStore,
    "BalanceClaimActiveStore"
);
export default BalanceClaimActiveStoreWrapped;
