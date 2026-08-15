import {Apis} from "bitsharesjs-ws";

const DEFISHARES_CHAIN_ID =
    "7089639ad55d91ef53946f3fc4dc86ea5b8a4917edcfce6d3c39bc259657acb5";
const BITSHARES_TESTNET_CHAIN_ID =
    "39f5e2ede1f8bc1a3a54a7914414e3779e33193f1f5693510e73cb7a87617447";

const DEFISHARES_MAINNET_BASES = ["DFS", "USD", "GOLD"];
const DEFISHARES_GENESIS_ASSETS = [
    "GOLD",
    "USD",
    "EUR",
    "CNY",
    "JPY",
    "GBP",
    "CHF",
    "HKD",
    "KRW",
    "INR",
    "CAD",
    "AUD",
    "SGD",
    "TWD",
    "RUB",
    "BRL",
    "MXN",
    "ZAR",
    "TRY",
    "AED",
    "SAR",
    "SEK",
    "NOK",
    "DKK",
    "PLN",
    "THB",
    "IDR",
    "MYR",
    "VND",
    "PHP",
    "XAU",
    "XAG",
    "XPT",
    "XPD",
    "US",
    "BTC",
    "ETH",
    "SILVER",
    "DEEPSEEK",
    "MOUTAI",
    "ABC",
    "ICBC",
    "CXMT",
    "TENCENT",
    "US.AAPL",
    "US.MSFT",
    "US.NVDA",
    "US.AMZN",
    "US.GOOGL",
    "US.META",
    "US.TSLA",
    "US.AVGO",
    "US.BRKA",
    "US.JPM",
    "US.VISA",
    "US.WMT",
    "US.LLY",
    "US.SNDK",
    "US.SPCX",
    "US.INTC",
    "US.AMD",
    "US.CSCO"
];
const DEFISHARES_MAINNET_QUOTES = Array.from(
    new Set(DEFISHARES_MAINNET_BASES.concat(DEFISHARES_GENESIS_ASSETS))
).sort();
/** This file centralized customization and branding efforts throughout the whole wallet and is meant to facilitate
 *  the process.
 *
 *  @author Stefan Schiessl <stefan.schiessl@blockchainprojectsbv.com>
 */

/**
 * Determine if we are running on testnet or mainnet
 * @private
 */
function _isTestnet() {
    const chainId = Apis.instance().chain_id;
    if (!chainId) {
        return false;
    }
    if (chainId === DEFISHARES_CHAIN_ID) {
        return false;
    }
    return chainId === BITSHARES_TESTNET_CHAIN_ID;
}

/**
 * Wallet name that is used throughout the UI and also in translations
 * @returns {string}
 */
export function getWalletName() {
    return "DefiShares";
}

/**
 * URL of this wallet
 * @returns {string}
 */
export function getWalletURL() {
    return "http://127.0.0.1:8080";
}

/**
 * Returns faucet information
 *
 * @returns {{url: string, show: boolean}}
 */
export function getFaucet() {
    const faucetUrl =
        typeof __FAUCET_URL__ !== "undefined" ? __FAUCET_URL__ : "";
    const faucetReferrer =
        typeof __FAUCET_REFERRER__ !== "undefined" ? __FAUCET_REFERRER__ : "";
    return {
        url: faucetUrl,
        show: !!faucetUrl,
        editable: false,
        referrer: faucetReferrer
    };
}

export function getTestFaucet() {
    const faucetUrl =
        typeof __TESTNET_FAUCET_URL__ !== "undefined"
            ? __TESTNET_FAUCET_URL__
            : "";
    return {
        url: faucetUrl,
        show: !!faucetUrl,
        editable: false
    };
}

/**
 * Logo that is used throughout the UI
 * @returns {*}
 */
export function getLogo(theme = "lightTheme") {
    if (theme === "darkTheme" || theme === "midnightTheme") {
        return require("assets/logo-ico-dark.png").default;
    }
    return require("assets/logo-ico-blue.png").default;
}

/**
 * Default set theme for the UI
 * @returns {string}
 */
export function getDefaultTheme() {
    // possible ["darkTheme", "lightTheme", "midnightTheme"]
    return "darkTheme";
}

/**
 * Default login method. Either "password" (for cloud login mode) or "wallet" (for local wallet mode)
 * @returns {string}
 */
export function getDefaultLogin() {
    // possible: one of "password", "wallet"
    return "password";
}

/**
 * Default units used by the UI
 *
 * @returns {[string,string,string,string,string,string]}
 */
export function getUnits() {
    if (_isTestnet()) {
        return ["TEST"];
    }
    return ["DFS", "GOLD"];
}

export function getDefaultMarket() {
    if (_isTestnet()) {
        return "USD_TEST";
    }
    return "GOLD_DFS";
}

/**
 * These are the highlighted bases in "My Markets" of the exchange
 *
 * @returns {[string]}
 */
export function getMyMarketsBases() {
    if (_isTestnet()) {
        return ["TEST"];
    }
    return DEFISHARES_MAINNET_BASES.slice();
}

/**
 * These are the default quotes that are shown after selecting a base
 *
 * @returns {[string]}
 */
export function getMyMarketsQuotes() {
    if (_isTestnet()) {
        return ["TEST"];
    }
    return DEFISHARES_MAINNET_QUOTES.slice();
}

/**
 * The featured markets displayed on the landing page of the UI
 *
 * @returns {list of string tuples}
 */
export function getFeaturedMarkets(quotes = []) {
    if (_isTestnet()) {
        return [["USD", "TEST"]];
    }
    const markets = [];
    DEFISHARES_MAINNET_BASES.forEach(base => {
        DEFISHARES_MAINNET_QUOTES.forEach(quote => {
            if (quote !== base) markets.push([quote, base]);
        });
    });
    return markets.filter(a => {
        if (!quotes.length) return true;
        return quotes.indexOf(a[0]) !== -1;
    });
}

/**
 * Recognized namespaces of assets
 *
 * @returns {[string,string,string,string,string,string,string]}
 */
export function getAssetNamespaces() {
    if (_isTestnet()) {
        return [];
    }
    return [];
}

/**
 * These namespaces will be hidden to the user, this may include "bit" for BitAssets
 * @returns {[string,string]}
 */
export function getAssetHideNamespaces() {
    // e..g "XBTSX.", "bit"
    return [];
}

/**
 * Allowed gateways that the user will be able to choose from in Deposit Withdraw modal
 * @param gateway
 * @returns {boolean}
 */
export function allowedGateway(gateway) {
    const allowedGateways = [];
    if (!gateway) {
        // answers the question: are any allowed?
        return allowedGateways.length > 0;
    }
    return allowedGateways.indexOf(gateway) >= 0;
}

export function getSupportedLanguages() {
    // not yet supported
}

export function getAllowedLogins() {
    // possible: list containing any combination of ["password", "wallet"]
    return ["password", "wallet"];
}

export function getConfigurationAsset() {
    // explanation will be parsed out of the asset description (via split)
    return {
        symbol: null,
        explanation:
            "This asset is used for decentralized configuration of the DefiShares UI."
    };
}

export function getHiveNewsTag() {
    return "defishares";
}
