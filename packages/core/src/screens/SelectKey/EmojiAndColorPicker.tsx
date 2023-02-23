import { Flex, Button } from '@chia-network/core';
import { Search as SearchIcon } from '@chia-network/icons';
import data from '@emoji-mart/data';
import { t } from '@lingui/macro';
import { InputBase, InputBaseProps, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { init, SearchIndex } from 'emoji-mart';
import React from 'react';

init({ data });

const { emojis: allEmojis } = data;

type EmojiAndColorPickerType = {
  onSelect?: (result: any) => void;
  onClickOutside?: () => void;
  currentColor?: string;
  currentEmoji?: string;
};

const colorCircleStyle: any = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  position: 'relative',
  zIndex: 10,
};

export default function EmojiAndColorPicker(props: EmojiAndColorPickerType) {
  const { onSelect = () => {}, onClickOutside = () => {}, currentColor, currentEmoji } = props;
  const cmpRef = React.useRef(null);
  const theme = useTheme();
  const [emojiFilter, setEmojiFilter] = React.useState<string[]>([]);
  const [tempColor, setTempColor] = React.useState<string>('');
  const [tempEmoji, setTempEmoji] = React.useState<string>('');

  const isDark = theme.palette.mode === 'dark';

  const pickerStyle: any = {
    backgroundColor: isDark ? '#344E54' : '#FFFFFF',
    border: '1px solid #CCDDE1',
    boxShadow: '0px 6px 19px rgba(15, 37, 42, 0.28), 0px 27px 65px rgba(101, 131, 138, 0.39)',
    borderRadius: '8px',
    padding: '16px',
    position: 'relative',
    top: '30px',
    left: '25px',
  };

  const outsideClickListener = (e: any) => {
    if (cmpRef.current && !(cmpRef.current as HTMLElement).contains(e.target)) {
      onClickOutside();
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', outsideClickListener);
    return () => {
      document.removeEventListener('mousedown', outsideClickListener);
    };
  }, []);

  function renderColorPicker() {
    const colors = [
      '#7EA9F8',
      '#C3C3EE',
      '#EAACFB',
      '#FAA7B0',
      '#FFAF3A',
      '#FFF544',
      '#D4FF72',
      '#92E39F',
      '#6CDCD6',
      '#77D4FF',
      '#AEB9CB',
      '#B1B2C8',
      '#C3B2C7',
      '#DEC3D3',
      '#CCB9A5',
      '#D2CE9F',
      '#BCC294',
      '#9BAE98',
      '#9FC0BC',
      '#95BBCB',
    ];

    const colorNodes = colors.map((color) => {
      const style = { ...colorCircleStyle, background: color };
      return (
        <div
          style={style}
          onClick={() => {
            setTempColor(color);
          }}
        >
          {(color === currentColor && !tempColor) || tempColor === color ? (
            <div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                border: `2px solid ${color}`,
                zIndex: 11,
                top: '-4px',
                left: '-4px',
              }}
            />
          ) : null}
        </div>
      );
    });
    return (
      <Flex sx={{ display: 'flex', flexWrap: 'wrap', columnGap: '8px', rowGap: '8px', width: '232px' }}>
        {colorNodes}
      </Flex>
    );
  }

  function renderSearch() {
    return (
      <Box
        sx={{
          position: 'relative',
          border: `1px solid #C5D8DC`,
          borderRadius: '8px',
          marginTop: '15px',
          input: {
            paddingLeft: '30px',
            fontSize: '14px',
          },
          '> div': {
            display: 'block',
          },
          padding: '5px 0 0 0',
        }}
      >
        <SearchIcon
          sx={{
            position: 'absolute',
            left: '8px',
            top: '8px',
            width: '17px',
            height: '17px',
            path: {
              stroke: theme.palette.mode === 'dark' ? theme.palette.info.main : 'theme.palette.info.main',
              fill: 'none',
            },
          }}
          color="secondary"
        />
        <InputBase
          autoFocus
          onChange={async (e: any) => {
            if (e.target.value !== '') {
              const emojis = await SearchIndex.search(e.target.value);
              setEmojiFilter(emojis.map((emoji: any) => emoji.skins[0].native));
            } else {
              setEmojiFilter([]);
            }
          }}
          size="small"
          placeholder={t`Search`}
        />
      </Box>
    );
  }

  function renderEmojis() {
    const style: any = {
      display: 'flex',
      maxHeight: '189px',
      overflowY: 'auto',
      scrollBehavior: 'auto',
      fontSize: '14px',
      width: '232px',
      gap: '6px',
      marginTop: '10px',
      flexWrap: 'wrap',
      padding: '5px',
      '>div': {
        width: '20px',
        height: '20px',
        textAlign: 'center',
        lineHeight: '20px',
      },
    };
    const emojiList = Object.keys(allEmojis)
      .filter((emojiName: string) => {
        if (emojiFilter.length) {
          return emojiFilter.indexOf(allEmojis[emojiName].skins[0].native) > -1;
        }
        return true;
      })
      .map((emojiName: string) => (
        <div
          onClick={() => {
            setTempEmoji(allEmojis[emojiName].skins[0].native);
          }}
          style={{
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              zIndex: 10,
            }}
          >
            {allEmojis[emojiName].skins[0].native}
          </div>
          {((allEmojis[emojiName].skins[0].native === currentEmoji && !tempEmoji) ||
            allEmojis[emojiName].skins[0].native === tempEmoji) && (
            <div
              style={{
                position: 'absolute',
                borderRadius: '2px',
                width: '26px',
                height: '26px',
                zIndex: 9,
                top: '-4px',
                left: '-4px',
                border: `2px solid #AEB9CB`,
              }}
            />
          )}
        </div>
      ));
    return <Flex sx={style}>{emojiList}</Flex>;
  }

  function renderButtonActions() {
    return (
      <Flex sx={{ marginTop: '10px' }} justifyContent="space-between">
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => {
            onSelect('');
          }}
        >
          {t`Cancel`}
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            if (tempColor) onSelect(tempColor);
            if (tempEmoji) onSelect(tempEmoji);
          }}
        >
          {t`Save`}
        </Button>
      </Flex>
    );
  }

  return (
    <Box style={pickerStyle} ref={cmpRef}>
      {renderColorPicker()}
      {renderSearch()}
      {renderEmojis()}
      {renderButtonActions()}
    </Box>
  );
}
