import type { ThemeAssets, ThemeVariantId } from '@chia-network/core';

import chiaAudioSmall from '../assets/theme/chia/audio-small.svg';
import chiaChiaBlack from '../assets/theme/chia/chia-black.svg';
import chiaChia from '../assets/theme/chia/chia.svg';
import chiaChiaCircle from '../assets/theme/chia/chia_circle.svg';
import chiaDocumentSmall from '../assets/theme/chia/document-small.svg';
import chiaModelSmall from '../assets/theme/chia/model-small.svg';
import chiaOfferFileIcon from '../assets/theme/chia/offerFileIcon.svg';
import chiaUnknownSmall from '../assets/theme/chia/unknown-small.svg';
import chiaVideoSmall from '../assets/theme/chia/video-small.svg';
import chiaWalletConnectToChia from '../assets/theme/chia/walletConnectToChia.svg';
import classicAudioSmall from '../assets/theme/classic/audio-small.svg';
import classicChiaBlack from '../assets/theme/classic/chia-black.svg';
import classicChia from '../assets/theme/classic/chia.svg';
import classicChiaCircle from '../assets/theme/classic/chia_circle.svg';
import classicDocumentSmall from '../assets/theme/classic/document-small.svg';
import classicModelSmall from '../assets/theme/classic/model-small.svg';
import classicOfferFileIcon from '../assets/theme/classic/offerFileIcon.svg';
import classicUnknownSmall from '../assets/theme/classic/unknown-small.svg';
import classicVideoSmall from '../assets/theme/classic/video-small.svg';
import classicWalletConnectToChia from '../assets/theme/classic/walletConnectToChia.svg';
import fieldAudioSmall from '../assets/theme/field/audio-small.svg';
import fieldChiaBlack from '../assets/theme/field/chia-black.svg';
import fieldChia from '../assets/theme/field/chia.svg';
import fieldChiaCircle from '../assets/theme/field/chia_circle.svg';
import fieldDocumentSmall from '../assets/theme/field/document-small.svg';
import fieldModelSmall from '../assets/theme/field/model-small.svg';
import fieldOfferFileIcon from '../assets/theme/field/offerFileIcon.svg';
import fieldUnknownSmall from '../assets/theme/field/unknown-small.svg';
import fieldVideoSmall from '../assets/theme/field/video-small.svg';
import fieldWalletConnectToChia from '../assets/theme/field/walletConnectToChia.svg';

/** Static per-variant SVG modules (whitelist only — no runtime loading from user input). */
export const GUI_THEME_ASSETS: Record<ThemeVariantId, ThemeAssets> = {
  classic: {
    chiaCircle: classicChiaCircle,
    chiaWordmark: classicChia,
    chiaWordmarkBlack: classicChiaBlack,
    audioSmall: classicAudioSmall,
    documentSmall: classicDocumentSmall,
    modelSmall: classicModelSmall,
    unknownSmall: classicUnknownSmall,
    videoSmall: classicVideoSmall,
    offerFileIcon: classicOfferFileIcon,
    walletConnectToChia: classicWalletConnectToChia,
  },
  field: {
    chiaCircle: fieldChiaCircle,
    chiaWordmark: fieldChia,
    chiaWordmarkBlack: fieldChiaBlack,
    audioSmall: fieldAudioSmall,
    documentSmall: fieldDocumentSmall,
    modelSmall: fieldModelSmall,
    unknownSmall: fieldUnknownSmall,
    videoSmall: fieldVideoSmall,
    offerFileIcon: fieldOfferFileIcon,
    walletConnectToChia: fieldWalletConnectToChia,
  },
  chia: {
    chiaCircle: chiaChiaCircle,
    chiaWordmark: chiaChia,
    chiaWordmarkBlack: chiaChiaBlack,
    audioSmall: chiaAudioSmall,
    documentSmall: chiaDocumentSmall,
    modelSmall: chiaModelSmall,
    unknownSmall: chiaUnknownSmall,
    videoSmall: chiaVideoSmall,
    offerFileIcon: chiaOfferFileIcon,
    walletConnectToChia: chiaWalletConnectToChia,
  },
};
