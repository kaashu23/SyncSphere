import React from 'react';

const STICKERS = [
  'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
  'https://media.giphy.com/media/l41YkxvU8c7J7Bba0/giphy.gif',
  'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
  'https://media.giphy.com/media/3o6Zt481isNvuFIWc0/giphy.gif',
  'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
  'https://media.giphy.com/media/11ISwbgCxEzMyY/giphy.gif',
  'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
  'https://media.giphy.com/media/xUPGcxpCV81ebhq7c0/giphy.gif'
];

export default function StickerPicker({ onSelect }) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-xl shadow-xl p-3 w-[300px] h-[350px] overflow-y-auto z-50 flex flex-col">
      <div className="text-on-surface font-semibold text-sm mb-2 px-1">Stickers & GIFs</div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {STICKERS.map((url, i) => (
          <div key={i} className="aspect-square bg-surface-container rounded-lg overflow-hidden relative group cursor-pointer hover:ring-2 ring-primary transition-all" onClick={() => onSelect(url)}>
            <img src={url} alt="sticker" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
