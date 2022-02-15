import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import brain from '../assets/brain.png';
import { HoldToAuthorizeButton } from '../components/buttons';
import { RegistrationReviewRows } from '../components/ens-registration';
import { GasSpeedButton } from '../components/gas';
import { SheetActionButtonRow, SlackSheet } from '../components/sheet';
import { executeRap, RapActionTypes } from '../raps/common';
import { Box, Inline, Inset, Stack, Text } from '@rainbow-me/design-system';
import { generateSalt, getRentPrice } from '@rainbow-me/helpers/ens';
import { addBuffer } from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useCurrentNonce,
  useENSProfile,
  useENSRegistration,
  useENSRegistrationCosts,
  useGas,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { loadWallet } from '@rainbow-me/model/wallet';
import { getRapEstimationByType } from '@rainbow-me/raps';
import { saveCommitRegistrationParameters } from '@rainbow-me/redux/ensRegistration';

export const ENSConfirmRegisterSheetHeight = 600;
const secsInYear = 31536000;

export default function ENSConfirmRegisterSheet() {
  const dispatch = useDispatch();
  const { gasFeeParamsBySpeed, updateTxFee, startPollingGasFees } = useGas();
  const { name: ensName, records } = useENSProfile();
  const { accountAddress, network } = useAccountSettings();
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const [rentPrice, setRentPrice] = useState();
  const [gasLimit, setGasLimit] = useState();

  const [duration, setDuration] = useState(1);

  const name = ensName.replace('.eth', '');
  const { data: registrationData } = useENSRegistration({
    name,
  });
  const { data: registrationCostsData } = useENSRegistrationCosts({
    duration,
    name,
    rentPrice: registrationData?.rentPrice,
  });

  useEffect(() => {
    const callbackGetRentPrice = async () => {
      const rentPrice = await getRentPrice(name, secsInYear);
      setRentPrice(addBuffer(rentPrice.toString(), 1.1));
    };
    callbackGetRentPrice();
  }, [name]);

  const updateGasLimit = useCallback(async () => {
    const salt = generateSalt();
    const gasLimit = await getRapEstimationByType(RapActionTypes.commitENS, {
      ensRegistrationParameters: {
        duration: secsInYear,
        name: name,
        ownerAddress: accountAddress,
        records,
        rentPrice,
        salt,
      },
    });
    updateTxFee(gasLimit);
    setGasLimit(gasLimit);
  }, [accountAddress, name, records, rentPrice, updateTxFee]);

  // Update gas limit
  useEffect(() => {
    if (!gasLimit && !isEmpty(gasFeeParamsBySpeed)) {
      updateGasLimit();
    }
  }, [gasFeeParamsBySpeed, gasLimit, updateGasLimit, updateTxFee]);

  useEffect(() => startPollingGasFees(), [startPollingGasFees]);

  const handleCommitSubmit = useCallback(async () => {
    const wallet = await loadWallet();
    if (!wallet) {
      return;
    }

    const callback = () => null;

    const nonce = await getNextNonce();
    const salt = generateSalt();

    const ensRegistrationParameters = {
      duration: secsInYear,
      name,
      nonce,
      ownerAddress: accountAddress,
      records,
      rentPrice,
      salt,
    };

    await dispatch(
      saveCommitRegistrationParameters(
        accountAddress,
        ensRegistrationParameters
      )
    );

    await executeRap(
      wallet,
      RapActionTypes.commitENS,
      { ensRegistrationParameters },
      callback
    );
  }, [accountAddress, dispatch, getNextNonce, name, records, rentPrice]);

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={ENSConfirmRegisterSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <Box
        background="body"
        paddingVertical="30px"
        style={{ height: ENSConfirmRegisterSheetHeight }}
      >
        <Box flexGrow={1}>
          <Inset horizontal="30px">
            <Stack space="34px">
              <Inline
                alignHorizontal="center"
                alignVertical="center"
                space="6px"
                wrap={false}
              >
                <Box>
                  <ImgixImage
                    source={brain}
                    style={{ height: 20, width: 20 }}
                  />
                </Box>
                <Text color="secondary50" size="14px" weight="heavy">
                  Buy more years now to save on fees
                </Text>
              </Inline>
              <RegistrationReviewRows
                duration={duration}
                maxDuration={99}
                networkFee={registrationCostsData?.estimatedNetworkFee?.display}
                onChangeDuration={setDuration}
                registrationFee={
                  registrationCostsData?.estimatedRentPrice?.total?.display
                }
                totalCost={
                  registrationCostsData?.estimatedTotalRegistrationCost?.display
                }
              />
            </Stack>
          </Inset>
        </Box>

        <SheetActionButtonRow>
          <HoldToAuthorizeButton
            hideInnerBorder
            isLongPressAvailableForBiometryType
            label="Hold to Commit"
            onLongPress={handleCommitSubmit}
            parentHorizontalPadding={19}
            showBiometryIcon
          />
        </SheetActionButtonRow>
        <Box alignItems="center" flexGrow={1} justifyContent="center">
          <GasSpeedButton currentNetwork="mainnet" theme="light" />
        </Box>
      </Box>
    </SlackSheet>
  );
}
