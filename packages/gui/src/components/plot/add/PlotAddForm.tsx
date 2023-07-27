import { defaultPlotter, toBech32m, fromBech32m, WalletCreatePool } from '@chia-network/api';
import { useStartPlottingMutation, useCreateNewPoolWalletMutation } from '@chia-network/api-react';
import { Back, useShowError, ButtonLoading, Flex, Form } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router';

import PlotNFTState from '../../../constants/PlotNFTState';
import PlotterName from '../../../constants/PlotterName';
import { plottingInfo } from '../../../constants/plotSizes';
import useUnconfirmedPlotNFTs from '../../../hooks/useUnconfirmedPlotNFTs';
import PlotAddConfig from '../../../types/PlotAdd';
import { PlotterDefaults, PlotterOptions } from '../../../types/Plotter';
import PlotAddChooseKeys from './PlotAddChooseKeys';
import PlotAddChoosePlotter from './PlotAddChoosePlotter';
import PlotAddChooseSize from './PlotAddChooseSize';
import PlotAddNFT from './PlotAddNFT';
import PlotAddNumberOfPlots from './PlotAddNumberOfPlots';
import PlotAddSelectFinalDirectory from './PlotAddSelectFinalDirectory';

type FormData = PlotAddConfig & {
  p2SingletonPuzzleHash?: string;
  createNFT?: boolean;
  plotNFTContractAddr?: string;
  useManualKeySetup: boolean;
};

type Props = {
  fingerprint: number;
  plotters: Record<
    PlotterName,
    {
      displayName: string;
      version: string;
      options: PlotterOptions;
      defaults: PlotterDefaults;
      installInfo: {
        installed: boolean;
        canInstall: boolean;
        bladebitMemoryWarning?: string;
      };
    }
  >;
  currencyCode: string;
};

export default function PlotAddForm(props: Props) {
  const { fingerprint, plotters, currencyCode } = props;

  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const showError = useShowError();

  const { add: addUnconfirmedPlotNFT } = useUnconfirmedPlotNFTs();
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
    const plotterDefaults = plotters[plotterName]?.defaults ?? defaultPlotter.defaults;
    const { plotSize } = plotterDefaults;
    const maxRam = plottingInfo[plotterName].find((element) => element.value === plotSize)?.defaultRam;
    const defaults = {
      ...plotterDefaults,
      ...otherDefaults,
      maxRam,
    };

    return defaults;
  };

  const methods = useForm<FormData>({
    defaultValues: defaultsForPlotter(PlotterName.BLADEBIT_DISK),
  });

  const { watch, setValue, reset, getValues } = methods;
  const plotterName = watch('plotterName') as PlotterName;
  const plotSize = watch('plotSize');

  useEffect(() => {
    const plotSizeConfig = plottingInfo[plotterName].find((item) => item.value === plotSize);
    if (plotSizeConfig) {
      setValue('maxRam', plotSizeConfig.defaultRam);
    }
  }, [plotSize, plotterName, setValue]);

  const plotter = plotters[plotterName] ?? defaultPlotter;
  let step = 1;

  const handlePlotterChanged = (newPlotterName: PlotterName) => {
    const defaults = defaultsForPlotter(newPlotterName);
    const formValues = getValues();
    reset({
      ...defaults,
      farmerPublicKey: formValues.farmerPublicKey,
      p2SingletonPuzzleHash: formValues.p2SingletonPuzzleHash,
      plotNFTContractAddr: formValues.plotNFTContractAddr,
      poolPublicKey: formValues.poolPublicKey,
    });
  };

  const handleSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setLoading(true);
      const {
        p2SingletonPuzzleHash,
        delay,
        createNFT,
        plotterName: formPlotterName,
        workspaceLocation,
        workspaceLocation2,
        useManualKeySetup,
        farmerPublicKey,
        poolPublicKey,
        plotNFTContractAddr,
        ...rest
      } = data;

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
          initialTargetState: { state: stateLocal },
        } = nftData;
        const { transaction, p2SingletonPuzzleHash: p2SingletonPuzzleHashLocal } = (await createNewPoolWallet({
          initialTargetState,
          fee,
        }).unwrap()) as WalletCreatePool;

        if (!p2SingletonPuzzleHashLocal) {
          throw new Error(t`p2SingletonPuzzleHash is not defined`);
        }

        addUnconfirmedPlotNFT({
          transactionId: transaction.name,
          state: stateLocal === 'SELF_POOLING' ? PlotNFTState.SELF_POOLING : PlotNFTState.FARMING_TO_POOL,
          poolUrl: initialTargetState.poolUrl,
        });

        selectedP2SingletonPuzzleHash = p2SingletonPuzzleHashLocal;
      }

      const plotAddConfig = {
        ...rest,
        delay: delay * 60,
        plotterName: formPlotterName,
        workspaceLocation,
        workspaceLocation2: formPlotterName === 'madmax' ? workspaceLocation2 || workspaceLocation : workspaceLocation2,
        farmerPublicKey: undefined as string | undefined,
        poolPublicKey: undefined as string | undefined,
      };

      if (!selectedP2SingletonPuzzleHash && plotNFTContractAddr) {
        selectedP2SingletonPuzzleHash = fromBech32m(plotNFTContractAddr);
      }

      if (selectedP2SingletonPuzzleHash) {
        plotAddConfig.c = toBech32m(selectedP2SingletonPuzzleHash, currencyCode.toLowerCase());
      }

      if (!selectedP2SingletonPuzzleHash && !farmerPublicKey && !poolPublicKey && fingerprint) {
        plotAddConfig.fingerprint = fingerprint;
      }

      if (useManualKeySetup) {
        if (farmerPublicKey) {
          if (farmerPublicKey.length !== 96) {
            await showError(new Error(t`Farmer public key is invalid`));
            return;
          }
          plotAddConfig.farmerPublicKey = farmerPublicKey;
        }
        if (poolPublicKey && !selectedP2SingletonPuzzleHash) {
          if (poolPublicKey.length !== 96) {
            await showError(new Error(t`Pool public key is invalid`));
            return;
          }
          plotAddConfig.poolPublicKey = poolPublicKey;
        }
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
        <PlotAddNFT ref={addNFTref} step={step++} />
        <PlotAddChoosePlotter step={step++} onChange={handlePlotterChanged} />
        <PlotAddChooseKeys step={step++} currencyCode={currencyCode} fingerprint={fingerprint} />
        <PlotAddChooseSize step={step++} plotter={plotter} />
        <PlotAddSelectFinalDirectory step={step++} plotter={plotter} />
        <PlotAddNumberOfPlots step={step++} plotter={plotter} />
        <Flex justifyContent="flex-end">
          <ButtonLoading loading={loading} color="primary" type="submit" variant="contained">
            <Trans>Create</Trans>
          </ButtonLoading>
        </Flex>
      </Flex>
    </Form>
  );
}
