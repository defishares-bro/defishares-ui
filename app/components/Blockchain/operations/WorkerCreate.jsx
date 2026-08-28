import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const WorkerCreate = ({op, fromComponent}) => {
    if (op[0] === 79 || op[1].refund_budget_ratio !== undefined) {
        return (
            <span>
                {op[1].name} ({op[1].refund_budget_ratio / 100}% refund)
            </span>
        );
    }
    const goldPay = op[1].gold_daily_pay;
    const pay = goldPay || {amount: op[1].daily_pay, asset_id: "1.3.0"};

    if (fromComponent === "proposed_operation") {
        return (
            <span>
                <Translate component="span" content="proposal.create_worker" />
                &nbsp;
                <FormattedAsset
                    style={{fontWeight: "bold"}}
                    amount={pay.amount}
                    asset={pay.asset_id}
                />
            </span>
        );
    } else {
        return (
            <span>
                <TranslateWithLinks
                    string="operation.worker_create"
                    keys={[
                        {
                            type: "account",
                            value: op[1].owner,
                            arg: "account"
                        },
                        {
                            type: "amount",
                            value: pay,
                            arg: "pay"
                        }
                    ]}
                    params={{
                        name: op[1].name
                    }}
                />
            </span>
        );
    }
};
