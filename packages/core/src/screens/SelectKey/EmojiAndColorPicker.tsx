import { Flex /* , Button */ } from '@chia-network/core';
import { Search as SearchIcon } from '@chia-network/icons';
import data from '@emoji-mart/data';
import { t } from '@lingui/macro';
import { InputBase /* , InputBaseProps */, Box } from '@mui/material';
import { init, SearchIndex } from 'emoji-mart';
import React, { useCallback } from 'react';

init({ data });

const { emojis: allEmojis } = data;

type EmojiAndColorPickerType = {
  onSelect: (result: any) => void;
  onClickOutside?: () => void;
  currentColor?: string;
  currentEmoji?: string;
  themeColors: any;
  isDark: boolean;
};

const colorCircleStyle: any = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  position: 'relative',
  zIndex: 10,
};

export default function EmojiAndColorPicker(props: EmojiAndColorPickerType) {
  const { onSelect = () => {}, onClickOutside = () => {}, currentColor, currentEmoji, themeColors, isDark } = props;
  const cmpRef = React.useRef(null);
  const [emojiFilter, setEmojiFilter] = React.useState<string[]>([]);
  // const [tempEmoji, setTempEmoji] = React.useState<string>('');

  const pickerStyle: any = {
    backgroundColor: isDark ? '#344E54' : '#FFFFFF',
    border: '1px solid #CCDDE1',
    boxShadow: '0px 6px 19px rgba(15, 37, 42, 0.28), 0px 27px 65px rgba(101, 131, 138, 0.39)',
    borderRadius: '8px',
    padding: '0px',
    position: 'relative',
    top: '30px',
    left: '25px',
  };

  const outsideClickListener = useCallback(
    (e: any) => {
      if (cmpRef.current && !(cmpRef.current as HTMLElement).contains(e.target)) {
        onClickOutside();
      }
    },
    [onClickOutside]
  );

  React.useEffect(() => {
    document.addEventListener('mousedown', outsideClickListener);
    return () => {
      document.removeEventListener('mousedown', outsideClickListener);
    };
  }, [outsideClickListener]);

  function renderColorPicker() {
    const colorNodes = Object.keys(themeColors)
      .filter((colorKey) => colorKey !== 'default')
      .map((colorKey) => {
        const style = { ...colorCircleStyle, background: themeColors[colorKey].border };
        return (
          <div
            style={style}
            onClick={() => {
              onSelect(colorKey);
            }}
          >
            {colorKey === currentColor ? (
              <div
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  border: `2px solid ${themeColors[colorKey].border}`,
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
      <Flex
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          columnGap: '8px',
          rowGap: '8px',
          width: '262px',
          padding: '15px 15px 0 15px',
        }}
      >
        {colorNodes}
      </Flex>
    );
  }

  function renderSearch() {
    return (
      <Flex sx={{ padding: '0 15px' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
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
                stroke: isDark ? '#eee' : '#999',
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
      </Flex>
    );
  }

  function renderEmojis() {
    const style: any = {
      display: 'flex',
      maxHeight: '171px',
      overflowY: 'auto',
      scrollBehavior: 'auto',
      fontSize: '14px',
      width: '246px',
      gap: '3px',
      marginTop: '10px',
      flexWrap: 'wrap',
      padding: '5px',
      '>div': {
        fontSize: '18px',
        textAlign: 'center',
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
            onSelect(allEmojis[emojiName].skins[0].native);
          }}
          style={{
            position: 'relative',
            borderRadius: '4px',
            background: `${
              allEmojis[emojiName].skins[0].native === currentEmoji
                ? themeColors[currentColor || 'default'].main
                : 'inherit'
            }`,
            width: '25px',
            height: '25px',
            zIndex: 9,
            paddingTop: '2px',
          }}
        >
          {allEmojis[emojiName].skins[0].native}
          {allEmojis[emojiName].skins[0].native === currentEmoji && <div style={{}} />}
        </div>
      ));
    return (
      <Flex sx={{ padding: '0 0 10px 7px' }}>
        <Flex sx={style}>{emojiList}</Flex>
      </Flex>
    );
  }

  return (
    <Box style={pickerStyle} ref={cmpRef}>
      {renderColorPicker()}
      {renderSearch()}
      {renderEmojis()}
    </Box>
  );
}
