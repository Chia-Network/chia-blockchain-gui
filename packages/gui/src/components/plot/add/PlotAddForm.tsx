import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { t, Trans } from '@lingui/macro';
import { defaultPlotter, toBech32m, fromBech32m } from '@chia/api';
import {
  useStartPlottingMutation,
  useCreateNewPoolWalletMutation,
} from '@chia/api-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Back, useShowError, ButtonLoading, Flex, Form } from '@chia/core';
import PlotAddChoosePlotter from './PlotAddChoosePlotter';
import PlotAddChooseSize from './PlotAddChooseSize';
import PlotAddNumberOfPlots from './PlotAddNumberOfPlots';
import PlotAddSelectTemporaryDirectory from './PlotAddSelectTemporaryDirectory';
import PlotAddSelectFinalDirectory from './PlotAddSelectFinalDirectory';
import PlotAddNFT from './PlotAddNFT';
import PlotAddConfig from '../../../types/PlotAdd';
import plotSizes from '../../../constants/plotSizes';
import PlotNFTState from '../../../constants/PlotNFTState';
import PlotterName from '../../../constants/PlotterName';
import useUnconfirmedPlotNFTs from '../../../hooks/useUnconfirmedPlotNFTs';

type FormData = PlotAddConfig & {
  p2SingletonPuzzleHash?: string;
  createNFT?: boolean;
  plotNFTContractAddr?: string;
};

type Props = {
  fingerprint: number;
  plotters: Object;
  currencyCode: string;
};

export default function PlotAddForm(props: Props) {
  const { fingerprint, plotters, currencyCode } = props;

  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const showError = useShowError();

  const {
    isLoading: isLoadingUnconfirmedPlotNFTs,
    add: addUnconfirmedPlotNFT,
  } = useUnconfirmedPlotNFTs();
  const [startPlotting] = useStartPlottingMutation();
  const [createNewPoolWallet] = useCreateNewPoolWalletMutation();
  const addNFTref = useRef();
  const { state } = useLocation();

  const otherDefaults = {
    plotCount: 1,
    queue: 'default',
    finalLocation: '',
    workspaceLocation: '',
    workspaceLocation2: '',
    farmerPublicKey: '',
    poolPublicKey: '',
    plotNFTContractAddr: '',
    excludeFinalDir: false,
    p2SingletonPuzzleHash: state?.p2SingletonPuzzleHash ?? '',
    createNFT: false,
  };

  const defaultsForPlotter = (plotterName: PlotterName) => {
    const plotterDefaults =
      plotters[plotterName]?.defaults ?? defaultPlotter.defaults;
    const plotSize = plotterDefaults.plotSize;
    const maxRam = plotSizes.find(
      (element) => element.value === plotSize,
    )?.defaultRam;
    const defaults = {
      ...plotterDefaults,
      ...otherDefaults,
      maxRam: maxRam,
    };

    return defaults;
  };

  const methods = useForm<FormData>({
    defaultValues: defaultsForPlotter(PlotterName.CHIAPOS),
  });

  const { watch, setValue, reset } = methods;
  const plotterName = watch('plotterName') as PlotterName;
  const plotSize = watch('plotSize');

  useEffect(() => {
    const plotSizeConfig = plotSizes.find((item) => item.value === plotSize);
    if (plotSizeConfig) {
      setValue('maxRam', plotSizeConfig.defaultRam);
    }
  }, [plotSize, setValue]);

  const plotter = plotters[plotterName] ?? defaultPlotter;
  let step = 1;
  const allowTempDirectorySelection: boolean =
    plotter.options.haveBladebitOutputDir === false;

  const handlePlotterChanged = (newPlotterName: PlotterName) => {
    const defaults = defaultsForPlotter(newPlotterName);
    reset(defaults);
  };

  const handleSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setLoading(true);
      const { p2SingletonPuzzleHash, delay, createNFT, ...rest } = data;
      const { farmerPublicKey, poolPublicKey, plotNFTContractAddr } = rest;

      let selectedP2SingletonPuzzleHash = p2SingletonPuzzleHash;

      if (!currencyCode) {
        throw new Error(t`Currency code is not defined`);
      }

      if (createNFT) {
        // create nft
        const nftData = await addNFTref.current?.getSubmitData();

        const {
          fee,
          initialTargetState,
          initialTargetState: { state },
        } = nftData;
        const { transaction, p2SingletonPuzzleHash } =
          await createNewPoolWallet({
            initialTargetState,
            fee,
          }).unwrap();

        if (!p2SingletonPuzzleHash) {
          throw new Error(t`p2SingletonPuzzleHash is not defined`);
        }

        addUnconfirmedPlotNFT({
          transactionId: transaction.name,
          state:
            state === 'SELF_POOLING'
              ? PlotNFTState.SELF_POOLING
              : PlotNFTState.FARMING_TO_POOL,
          poolUrl: initialTargetState.poolUrl,
        });

        selectedP2SingletonPuzzleHash = p2SingletonPuzzleHash;
      }

      const plotAddConfig = {
        ...rest,
        delay: delay * 60,
      };

      if (!selectedP2SingletonPuzzleHash && plotNFTContractAddr) {
        selectedP2SingletonPuzzleHash = fromBech32m(plotNFTContractAddr);
      }

      if (selectedP2SingletonPuzzleHash) {
        plotAddConfig.c = toBech32m(
          selectedP2SingletonPuzzleHash,
          currencyCode.toLowerCase(),
        );
      }

      if (
        !selectedP2SingletonPuzzleHash &&
        !farmerPublicKey &&
        !poolPublicKey &&
        fingerprint
      ) {
        plotAddConfig.fingerprint = fingerprint;
      }

      await startPlotting(plotAddConfig).unwrap();

      navigate('/dashboard/plot');
    } catch (error) {
      await showError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <Back variant="h5" form>
          <Trans>Add a Plot</Trans>
        </Back>
        <PlotAddChoosePlotter step={step++} onChange={handlePlotterChanged} />
        <PlotAddChooseSize step={step++} plotter={plotter} />
        <PlotAddNumberOfPlots step={step++} plotter={plotter} />
        {allowTempDirectorySelection && (
          <PlotAddSelectTemporaryDirectory step={step++} plotter={plotter} />
        )}
        <PlotAddSelectFinalDirectory step={step++} plotter={plotter} />
        <PlotAddNFT ref={addNFTref} step={step++} plotter={plotter} />
        <Flex justifyContent="flex-end">
          <ButtonLoading
            loading={loading}
            color="primary"
            type="submit"
            variant="contained"
          >
            <Trans>Create</Trans>
          </ButtonLoading>
        </Flex>
      </Flex>
    </Form>
  );
}
