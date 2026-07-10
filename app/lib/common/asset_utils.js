import assetConstants from "../chain/asset_constants";
import utils from "./utils";

export function getReferencePrice(quoteAsset, baseAsset) {
    if (!quoteAsset || !baseAsset) return null;

    const getValue = (asset, path, fallback = null) => {
        if (asset.getIn) return asset.getIn(path, fallback);
        return path.reduce(
            (value, key) =>
                value && typeof value === "object" ? value[key] : fallback,
            asset
        );
    };

    const feedReference = asset => {
        const assetId = getValue(asset, ["id"]);
        const precision = getValue(asset, ["precision"]);
        if (!assetId || typeof precision !== "number") return null;

        let rawPrice;
        try {
            rawPrice = AssetUtils.extractRawFeedPrice(asset);
        } catch (error) {
            return null;
        }

        rawPrice = rawPrice && rawPrice.toJS ? rawPrice.toJS() : rawPrice;
        if (!rawPrice || !rawPrice.base || !rawPrice.quote) return null;

        let referenceSide;
        let assetSide;
        if (rawPrice.base.asset_id === assetId) {
            assetSide = rawPrice.base;
            referenceSide = rawPrice.quote;
        } else if (rawPrice.quote.asset_id === assetId) {
            assetSide = rawPrice.quote;
            referenceSide = rawPrice.base;
        } else {
            return null;
        }

        const assetAmount = Number(assetSide.amount);
        const referenceAmount = Number(referenceSide.amount);
        if (
            !isFinite(assetAmount) ||
            !isFinite(referenceAmount) ||
            assetAmount <= 0 ||
            referenceAmount <= 0
        ) {
            return null;
        }

        return {
            referenceAssetId: referenceSide.asset_id,
            referenceSatoshisPerAsset:
                (referenceAmount / assetAmount) * Math.pow(10, precision)
        };
    };

    const quoteId = getValue(quoteAsset, ["id"]);
    const baseId = getValue(baseAsset, ["id"]);
    const quotePrecision = getValue(quoteAsset, ["precision"]);
    const basePrecision = getValue(baseAsset, ["precision"]);
    if (
        !quoteId ||
        !baseId ||
        typeof quotePrecision !== "number" ||
        typeof basePrecision !== "number"
    ) {
        return null;
    }

    const quoteReference = feedReference(quoteAsset);
    const baseReference = feedReference(baseAsset);
    let referencePrice = null;

    if (quoteReference && quoteReference.referenceAssetId === baseId) {
        referencePrice =
            quoteReference.referenceSatoshisPerAsset /
            Math.pow(10, basePrecision);
    } else if (baseReference && baseReference.referenceAssetId === quoteId) {
        referencePrice =
            Math.pow(10, quotePrecision) /
            baseReference.referenceSatoshisPerAsset;
    } else if (
        quoteReference &&
        baseReference &&
        quoteReference.referenceAssetId === baseReference.referenceAssetId
    ) {
        referencePrice =
            quoteReference.referenceSatoshisPerAsset /
            baseReference.referenceSatoshisPerAsset;
    }

    return referencePrice && isFinite(referencePrice) && referencePrice > 0
        ? referencePrice
        : null;
}

export default class AssetUtils {
    static getFlagBooleans(mask, isBitAsset = false) {
        let booleans = {
            charge_market_fee: false,
            white_list: false,
            override_authority: false,
            transfer_restricted: false,
            disable_force_settle: false,
            global_settle: false,
            disable_confidential: false,
            witness_fed_asset: false,
            committee_fed_asset: false,
            lock_max_supply: false,
            disable_new_supply: false,
            disable_mcr_update: false,
            disable_icr_update: false,
            disable_mssr_update: false,
            disable_bsrm_update: false,
            disable_collateral_bidding: false
        };

        if (mask === "all") {
            for (let flag in booleans) {
                if (
                    !isBitAsset &&
                    assetConstants.uia_permission_mask.indexOf(flag) === -1
                ) {
                    delete booleans[flag];
                } else {
                    booleans[flag] = true;
                }
            }
            return booleans;
        }

        for (let flag in booleans) {
            if (
                !isBitAsset &&
                assetConstants.uia_permission_mask.indexOf(flag) === -1
            ) {
                delete booleans[flag];
            } else {
                if (mask & assetConstants.permission_flags[flag]) {
                    booleans[flag] = true;
                }
            }
        }

        return booleans;
    }

    static getFlags(flagBooleans) {
        let keys = Object.keys(assetConstants.permission_flags);

        let flags = 0;

        keys.forEach(key => {
            if (flagBooleans[key] && key !== "global_settle") {
                flags += assetConstants.permission_flags[key];
            }
        });

        return flags;
    }

    static getPermissions(flagBooleans, isBitAsset = false) {
        let permissions = isBitAsset
            ? Object.keys(assetConstants.permission_flags)
            : assetConstants.uia_permission_mask;
        let flags = 0;
        permissions.forEach(permission => {
            if (flagBooleans[permission] && permission !== "global_settle") {
                flags += assetConstants.permission_flags[permission];
            }
        });

        if (isBitAsset && flagBooleans["global_settle"]) {
            flags += assetConstants.permission_flags["global_settle"];
        }

        return flags;
    }

    static parseDescription(description) {
        let parsed;
        description = utils.sanitize(description);
        try {
            parsed = JSON.parse(description);
        } catch (error) {}
        for (let key in parsed) {
            parsed[key] = utils.sanitize(parsed[key]);
        }
        return parsed ? parsed : {main: description};
    }

    static extractRawFeedPrice(asset) {
        /**
         * The naming convention is confusing!
         *
         * bitshares-core knows only settlement_price, which is the feed price as known from UI!
         *
         * UI definition:
         *  - Feed Price: Witness fed price, given by backend as settlement_price
         *  - Settlement Price: feed price * force settlement offset factor
         *
         */
        if (!!asset.bitasset) {
            return asset.bitasset.current_feed.settlement_price;
        }
        if (!!asset.current_feed) {
            return asset.current_feed.settlement_price;
        }
        if (!!asset.settlement_price) {
            return asset.settlement_price;
        }
        if (!!asset.get("bitasset")) {
            return asset.getIn([
                "bitasset",
                "current_feed",
                "settlement_price"
            ]);
        }
        if (!!asset.get("settlement_price")) {
            return asset.getIn(["settlement_price"]);
        }
        if (!!asset.get("current_feed")) {
            return asset.getIn(["current_feed", "settlement_price"]);
        }
        throw "Feed price not found!";
    }

    static getReferencePrice(quoteAsset, baseAsset) {
        return getReferencePrice(quoteAsset, baseAsset);
    }
}
