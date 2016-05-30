/// <reference path="./typings/index.d.ts" />

import uri = require("jsuri");
import {BaseService} from "./modules/base-service";
import * as fetch from "node-fetch";

export type AuthScope = (
    "read_content"       | 
    "write_content"      |
    "read_themes"        |
    "write_themes"       |
    "read_products"      |
    "write_products"     |
    "read_customers"     |
    "write_customers"    |
    "read_orders"        |
    "write_orders"       |
    "read_script_tags"   |
    "write_script_tags"  |
    "read_fulfillments"  |
    "write_fulfillments" |
    "read_shipping"      |
    "write_shipping"
);

export function isAuthenticRequest()
{
    throw new Error("Not Implemented");
}

export function isAuthenticProxyRequest()
{
    throw new Error("Not Implemented");
}

export function isAuthenticWebhook()
{
    throw new Error("Not Implemented");
}

/**
 * A convenience function that tries to ensure that a given URL is a valid Shopify store by checking the response headers for X-ShopId. This is an undocumented feature, use at your own risk.
 */
export async function isValidShopifyDomain(shopifyDomain: string)
{
    const url = new uri(shopifyDomain);
    url.protocol("https");
    url.path("/admin");
    
    const response = await fetch(url.toString(), {
        method: "HEAD",
        headers: BaseService.buildDefaultHeaders(),
    });
    
    return response.headers.has("X-ShopId");
}

/**
 * Builds an authorization URL for Shopify OAuth integration. Send your user to this URL where they'll be asked to accept installation of your Shopify app.
 * @param scopes An array of scope permissions that your app will need from the user.
 * @param shopifyDomain The user's Shopify URL.
 * @param shopifyApiKey Your app's API key. This is NOT your secret key.
 * @param redirectUrl An optional URL that the user will be sent to after integration. Override's the Shopify app's default redirect URL.
 * @param state An optional, random string value provided by your application which is unique for each authorization request. During the OAuth callback phase, your application should check that this value matches the one you provided to this method.
 */
export function buildAuthorizationUrl(scopes: AuthScope[], shopifyDomain: string, shopifyApiKey: string, redirectUrl?: string, state?: string)
{
    const url = new uri(shopifyDomain);
    url.protocol("https");
    url.path("admin/oauth/authorize");    
    url.addQueryParam("client_id", shopifyApiKey);
    url.addQueryParam("scope", scopes.join(","));
    
    if (redirectUrl)
    {
        url.addQueryParam("redirect_url", redirectUrl);
    }
    
    if (state)
    {
        url.addQueryParam("state", state);
    }
    
    return url.toString();
}

/**
 * Finalizes app installation, generating a permanent access token for the user's store.
 * @param code The authorization code generated by Shopify, which should be a parameter named 'code' on the request querystring.
 * @param shopifyDomain The store's Shopify domain, which should be a parameter named 'shop' on the request querystring.
 * @param shopifyApiKey Your app's public API key.
 * @param shopifySecretKey Your app's secret key.
 * @returns The access token.
 */
export async function authorize(code: string, shopDomain: string, shopifyApiKey: string, shopifySecretKey: string)
{
    const service = new BaseService(shopDomain, undefined, "admin/oauth");
    const response = await service.createRequest<string>("POST", "access_token", "access_token", {
        client_id: shopifyApiKey,
        client_secret: shopifySecretKey,
        code: code, 
    });
    
    return response;
}

export {BaseService};
export {ShopifyError} from "./modules/shopify-error";