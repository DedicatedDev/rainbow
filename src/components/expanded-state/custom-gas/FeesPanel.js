import { useNavigation } from '@react-navigation/core';
import { get } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import styled from 'styled-components';
import colors, { darkModeThemeColors } from '../../../styles/colors';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import FeesGweiInput from './FeesGweiInput';
import {
  calculateMinerTipAddDifference,
  calculateMinerTipSubstDifference,
} from '@rainbow-me/helpers/gas';
import { useGas } from '@rainbow-me/hooks';
import { gweiToWei, parseGasFeeParam } from '@rainbow-me/parsers';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
import { gasUtils } from '@rainbow-me/utils';

const Wrapper = styled(KeyboardAvoidingView)`
  ${padding(10, 24)}
`;

const PanelRow = styled(Row).attrs({
  alignItems: 'center',
  justify: 'space-between',
})`
  ${padding(10, 0)}
`;
const PanelRowThin = styled(Row).attrs({
  justify: 'space-between',
})`
  ${padding(0, 0)}
`;

const PanelLabel = styled(Text).attrs({
  size: 'lmedium',
  weight: 'heavy',
})``;

const PanelWarning = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.yellowFavorite,
  size: 'smedium',
  weight: 'heavy',
}))`
  position: absolute;
  bottom: 0;
`;

const PanelError = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.red,
  size: 'smedium',
  weight: 'heavy',
}))`
  position: absolute;
  bottom: 0;
`;

const GasTrendHeader = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  size: 'smedium',
  weight: 'heavy',
}))`
  padding-bottom: 0;
`;

const PanelColumn = styled(Column).attrs(() => ({
  justify: 'center',
}))``;

const Label = styled(Text).attrs(({ size, weight }) => ({
  size: size || 'lmedium',
  weight: weight || 'semibold',
}))``;

const GAS_FEE_INCREMENT = 1;
const MAX_BASE_FEE_RANGE = [1, 3];
const MINER_TIP_RANGE = [1, 2];

export default function FeesPanel({
  currentGasTrend,
  colorForAsset,
  onCustomGasFocus,
  theme = 'dark',
}) {
  const {
    selectedGasFee,
    currentBlockParams,
    updateToCustomGasFee,
    gasFeeParamsBySpeed,
  } = useGas();
  const { navigate } = useNavigation();

  const { updateGasFeeOption } = useGas();

  const [customMaxPriorityFee, setCustomMaxPriorityFee] = useState(
    get(selectedGasFee, 'gasFeeParams.maxPriorityFeePerGas.gwei', 0)
  );
  const [customMaxBaseFee, setCustomMaxBaseFee] = useState(
    get(selectedGasFee, 'gasFeeParams.maxFeePerGas.gwei', 0)
  );
  const [maxPriorityFeeWarning, setMaxPriorityFeeWarning] = useState(null);
  const [maxPriorityFeeError, setMaxPriorityFeeError] = useState(null);

  const [maxBaseFeeWarning, setMaxBaseFeeWarning] = useState(null);
  const [maxBaseFeeError, setMaxBaseFeeError] = useState(null);
  const [feesGweiInputFocused, setFeesGweiInputFocused] = useState(false);

  const selectedOptionIsCustom = useMemo(
    () => selectedGasFee?.option === 'custom',
    [selectedGasFee?.option]
  );

  const { maxFee, currentBaseFee, maxBaseFee, maxPriorityFee } = useMemo(() => {
    const maxFee = get(selectedGasFee, 'gasFee.maxFee.native.value.display', 0);
    const currentBaseFee = get(currentBlockParams, 'baseFeePerGas.gwei', 0);
    let maxBaseFee;
    if (selectedOptionIsCustom) {
      // block more thn 2 decimals on gwei value
      const decimals = Number(customMaxBaseFee) % 1;
      maxBaseFee =
        `${decimals}`.length > 4
          ? parseInt(customMaxBaseFee, 10)
          : customMaxBaseFee;
    } else {
      maxBaseFee = parseInt(
        get(selectedGasFee, 'gasFeeParams.maxFeePerGas.gwei', 0),
        10
      );
    }

    let maxPriorityFee;
    if (feesGweiInputFocused) {
      // block more thn 2 decimals on gwei value
      const decimals = Number(customMaxPriorityFee) % 1;
      maxPriorityFee =
        `${decimals}`.length > 4
          ? Number(parseFloat(customMaxPriorityFee).toFixed(2))
          : customMaxPriorityFee;
    } else {
      maxPriorityFee = get(
        selectedGasFee,
        'gasFeeParams.maxPriorityFeePerGas.gwei',
        0
      );
    }
    return { currentBaseFee, maxBaseFee, maxFee, maxPriorityFee };
  }, [
    selectedGasFee,
    currentBlockParams,
    selectedOptionIsCustom,
    feesGweiInputFocused,
    customMaxBaseFee,
    customMaxPriorityFee,
  ]);

  const renderRowLabel = useCallback(
    (label, type, error, warning) => {
      const openGasHelper = () =>
        navigate(Routes.EXPLAIN_SHEET, {
          currentBaseFee,
          currentGasTrend,
          type,
        });
      let color;
      let text;
      if (!error && !warning) {
        color =
          theme === 'dark'
            ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.4)
            : colors.alpha(colors.blueGreyDark, 0.4);
        text = '􀅵';
      } else if (error) {
        color = colors.red;
        text = '􀁟';
      } else {
        color = colors.yellowFavorite;
        text = '􀇿';
      }

      return (
        <PanelColumn>
          <ButtonPressAnimation onPress={openGasHelper}>
            <Row>
              <PanelLabel>
                {`${label} `}
                <Label color={color} size="smedium" weight="bold">
                  {text}
                </Label>
              </PanelLabel>
            </Row>
          </ButtonPressAnimation>
        </PanelColumn>
      );
    },
    [currentBaseFee, currentGasTrend, navigate, theme]
  );

  const formattedBaseFee = useMemo(
    () => `${parseInt(currentBaseFee, 10)} Gwei`,
    [currentBaseFee]
  );

  const handleFeesGweiInputFocus = useCallback(() => {
    onCustomGasFocus?.();
    !selectedOptionIsCustom && updateGasFeeOption('custom');
    const {
      gasFeeParams: { maxFeePerGas, maxPriorityFeePerGas },
    } = selectedGasFee;
    setCustomMaxPriorityFee(maxPriorityFeePerGas.gwei);
    setCustomMaxBaseFee(parseInt(maxFeePerGas.gwei));
  }, [
    onCustomGasFocus,
    selectedGasFee,
    updateGasFeeOption,
    selectedOptionIsCustom,
  ]);

  const handleCustomPriorityFeeFocus = useCallback(() => {
    setFeesGweiInputFocused(true);
    handleFeesGweiInputFocus();
  }, [handleFeesGweiInputFocus, setFeesGweiInputFocused]);

  const handleCustomPriorityFeeBlur = useCallback(() => {
    setFeesGweiInputFocused(false);
  }, [setFeesGweiInputFocused]);

  const updateGasFee = useCallback(
    ({ priorityFeePerGas = 0, feePerGas = 0 }) => {
      const maxFeePerGas = selectedGasFee?.gasFeeParams?.maxFeePerGas;
      const maxPriorityFeePerGas =
        selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas;

      const gweiMaxPriorityFeePerGas = maxPriorityFeePerGas?.gwei || 0;
      const gweiMaxFeePerGas = maxFeePerGas?.gwei || 0;
      const newGweiMaxPriorityFeePerGas =
        Math.round((gweiMaxPriorityFeePerGas + priorityFeePerGas) * 100) / 100;
      const newGweiMaxFeePerGas =
        Math.round((gweiMaxFeePerGas + feePerGas) * 100) / 100;

      const newMaxPriorityFeePerGas = parseGasFeeParam(
        Number(gweiToWei(newGweiMaxPriorityFeePerGas))
      );
      const newMaxFeePerGas = parseGasFeeParam(
        Number(gweiToWei(newGweiMaxFeePerGas))
      );

      if (newMaxPriorityFeePerGas.amount < 0 || newMaxFeePerGas.amount < 0)
        return;
      setCustomMaxPriorityFee(newMaxPriorityFeePerGas.gwei);
      setCustomMaxBaseFee(parseInt(newMaxFeePerGas.gwei, 10));

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxFeePerGas: newMaxFeePerGas,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const addMinerTip = useCallback(() => {
    updateGasFee({
      priorityFeePerGas: calculateMinerTipAddDifference(maxPriorityFee),
    });
  }, [updateGasFee, maxPriorityFee]);

  const substMinerTip = useCallback(() => {
    updateGasFee({
      priorityFeePerGas: -calculateMinerTipSubstDifference(maxPriorityFee),
    });
  }, [updateGasFee, maxPriorityFee]);

  const addMaxFee = useCallback(() => {
    updateGasFee({ feePerGas: GAS_FEE_INCREMENT });
  }, [updateGasFee]);

  const substMaxFee = useCallback(
    () => updateGasFee({ feePerGas: -GAS_FEE_INCREMENT }),
    [updateGasFee]
  );

  const onMaxBaseFeeChange = useCallback(
    ({ nativeEvent: { text } }) => {
      const maxFeePerGas = parseGasFeeParam(Number(gweiToWei(text)));
      const gweiMaxFeePerGas = maxFeePerGas.gwei;

      const newGweiMaxFeePerGas = Math.round(gweiMaxFeePerGas * 100) / 100;

      const newMaxFeePerGas = parseGasFeeParam(
        Number(gweiToWei(newGweiMaxFeePerGas))
      );

      if (newMaxFeePerGas.amount < 0) return;

      setCustomMaxBaseFee(text);

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxFeePerGas: newMaxFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const onMinerTipChange = useCallback(
    ({ nativeEvent: { text } }) => {
      const maxPriorityFeePerGas = parseGasFeeParam(Number(gweiToWei(text)));
      const gweiMaxPriorityFeePerGas = maxPriorityFeePerGas.gwei;

      const newGweiMaxPriorityFeePerGas =
        Math.round(gweiMaxPriorityFeePerGas * 100) / 100;

      const newMaxPriorityFeePerGas = parseGasFeeParam(
        Number(gweiToWei(newGweiMaxPriorityFeePerGas))
      );
      if (newMaxPriorityFeePerGas.amount < 0) return;

      setCustomMaxPriorityFee(text);

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const renderWarning = useCallback(
    (error, warning) => {
      if (!selectedOptionIsCustom) return;
      return (
        (error && <PanelError>{error}</PanelError>) ||
        (warning && <PanelWarning>{warning}</PanelWarning>)
      );
    },
    [selectedOptionIsCustom]
  );

  useEffect(() => {
    // validate not zero
    if (!maxBaseFee || maxBaseFee === '0') {
      setMaxBaseFeeError('1 Gwei to avoid failure');
    } else {
      setMaxBaseFeeError(null);
    }
    if (maxBaseFee < MAX_BASE_FEE_RANGE[0] * currentBaseFee) {
      setMaxBaseFeeWarning('Lower than recommended');
    } else if (maxBaseFee > MAX_BASE_FEE_RANGE[1] * currentBaseFee) {
      setMaxBaseFeeWarning('Higher than necessary');
    } else {
      setMaxBaseFeeWarning(null);
    }
  }, [maxBaseFee, currentBaseFee, gasFeeParamsBySpeed.normal]);

  useEffect(() => {
    // validate not zero
    if (!maxPriorityFee || maxPriorityFee === '0') {
      setMaxPriorityFeeError('1 Gwei to avoid failure');
    } else {
      setMaxPriorityFeeError(null);
    }
    if (
      maxPriorityFee <
      MINER_TIP_RANGE[0] *
        gasFeeParamsBySpeed?.normal?.maxPriorityFeePerGas?.gwei
    ) {
      setMaxPriorityFeeWarning('Lower than recommended');
    } else if (
      maxPriorityFee >
      MINER_TIP_RANGE[1] *
        gasFeeParamsBySpeed?.urgent?.maxPriorityFeePerGas?.gwei
    ) {
      setMaxPriorityFeeWarning('Higher than necessary');
    } else {
      setMaxPriorityFeeWarning(null);
    }
  }, [
    maxBaseFee,
    currentBaseFee,
    maxPriorityFee,
    gasFeeParamsBySpeed?.urgent?.maxPriorityFeePerGas?.gwei,
    gasFeeParamsBySpeed?.normal?.maxPriorityFeePerGas?.gwei,
  ]);

  return (
    <Wrapper>
      <PanelRowThin>
        <PanelColumn />
        <PanelColumn>
          <GasTrendHeader color={gasUtils.GAS_TRENDS[currentGasTrend].color}>
            {gasUtils.GAS_TRENDS[currentGasTrend].label}
          </GasTrendHeader>
        </PanelColumn>
      </PanelRowThin>
      <PanelRow justify="space-between">
        {renderRowLabel('Current Base Fee', 'currentBaseFee')}
        <PanelColumn>
          <PanelLabel>{formattedBaseFee}</PanelLabel>
        </PanelColumn>
      </PanelRow>
      <PanelRow>
        {renderRowLabel(
          'Max Base Fee',
          'maxBaseFee',
          maxBaseFeeError,
          maxBaseFeeWarning
        )}
        {renderWarning(maxBaseFeeError, maxBaseFeeWarning)}

        <PanelColumn>
          <FeesGweiInput
            buttonColor={colorForAsset}
            minusAction={substMaxFee}
            onChange={onMaxBaseFeeChange}
            onPress={handleFeesGweiInputFocus}
            plusAction={addMaxFee}
            value={maxBaseFee}
          />
        </PanelColumn>
      </PanelRow>
      <PanelRow>
        {renderRowLabel(
          'Miner Tip',
          `minerTip`,
          maxPriorityFeeError,
          maxPriorityFeeWarning
        )}
        {renderWarning(maxPriorityFeeError, maxPriorityFeeWarning)}

        <PanelColumn>
          <FeesGweiInput
            buttonColor={colorForAsset}
            minusAction={substMinerTip}
            onBlur={handleCustomPriorityFeeBlur}
            onChange={onMinerTipChange}
            onPress={handleCustomPriorityFeeFocus}
            plusAction={addMinerTip}
            value={maxPriorityFee}
          />
        </PanelColumn>
      </PanelRow>
      <PanelRow>
        <PanelColumn>
          <PanelLabel>Max Transaction Fee</PanelLabel>
        </PanelColumn>
        <PanelColumn>
          <PanelLabel>{maxFee}</PanelLabel>
        </PanelColumn>
      </PanelRow>
    </Wrapper>
  );
}