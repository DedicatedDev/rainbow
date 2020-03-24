import { get, toUpper } from 'lodash';
import { convertRawAmountToBalance } from '../helpers/utilities';
import { dedupeUniqueTokens } from './uniqueTokens';

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return {Array}
 */
export const parseAccountAssets = (data, uniqueTokens, tokenOverrides) => {
  const dedupedAssets = dedupeUniqueTokens(data, uniqueTokens);
  return dedupedAssets.map(assetData => {
    const asset = parseAsset(assetData.asset, tokenOverrides);
    return {
      ...asset,
      balance: convertRawAmountToBalance(assetData.quantity, asset),
    };
  });
};

const sanitize = s => s.replace(/[^a-z0-9áéíóúñü \.,_@:-]/gim, '');

export const parseAssetName = (name, address, overrides) => {
  if (get(overrides[address], 'name')) return overrides[address].name;
  return name ? sanitize(name) : 'Unknown Token';
};

export const parseAssetSymbol = (symbol, address, overrides) => {
  if (get(overrides[address], 'symbol')) return overrides[address].symbol;
  return symbol ? toUpper(sanitize(symbol)) : '———';
};

/**
 * @desc parse asset
 * @param  {Object} assetData
 * @return {Object}
 */
export const parseAsset = (
  { asset_code: address, ...asset } = {},
  tokenOverrides
) => {
  const name = parseAssetName(asset.name, address, tokenOverrides);
  return {
    ...asset,
    ...tokenOverrides[address],
    address,
    name,
    symbol: parseAssetSymbol(asset.symbol, address, tokenOverrides),
    uniqueId: address || name,
  };
};
