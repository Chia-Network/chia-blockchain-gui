import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import NFTsIcon from './images/NFTs.svg';
import NFTsSmallIcon from './images/NFTsSmall.svg';
import CopyIcon from './images/copy.svg';
import FilterIcon from './images/filter.svg';
import FolderIcon from './images/folder.svg';
import InboxIcon from './images/inbox.svg';
import PlusIcon from './images/plus.svg';
import ProfileIcon from './images/profile.svg';
import ReloadIcon from './images/reload.svg';
import ShowHideIcon from './images/show-hide.svg';
import TrashIcon from './images/trash.svg';
import UnassignedIcon from './images/unassigned.svg';

export function NFTsSmall(props: SvgIconProps) {
  return <SvgIcon component={NFTsSmallIcon} viewBox="0 0 18 18" {...props} />;
}

export default function NFTs(props: SvgIconProps) {
  return <SvgIcon component={NFTsIcon} viewBox="0 0 38 28" {...props} />;
}

export function Reload(props: SvgIconProps) {
  return <SvgIcon component={ReloadIcon} viewBox="-3 -3 26 26" {...props} />;
}

function CopyIconWithoutFill() {
  // this icons looks bad when filling any color
  return <CopyIcon fill="none" />;
}

export function Copy(props: SvgIconProps) {
  return <SvgIcon fill="none" component={CopyIconWithoutFill} inheritViewBox {...props} />;
}

function FilterIconWithoutFill() {
  return <FilterIcon fill="none" />;
}

export function Filter(props: SvgIconProps) {
  return <SvgIcon component={FilterIconWithoutFill} inheritViewBox {...props} />;
}

function FolderIconWithoutFill() {
  return <FolderIcon fill="none" />;
}

export function Folder(props: SvgIconProps) {
  return <SvgIcon component={FolderIconWithoutFill} inheritViewBox {...props} />;
}

function InboxIconWithoutFill(props: SvgIconProps) {
  return <InboxIcon {...props} style={{ fill: 'none', height: '22px', width: '22px' }} />;
}

export function Inbox(props: SvgIconProps) {
  return <SvgIcon component={InboxIconWithoutFill} inheritViewBox {...props} />;
}

function ProfileIconWithoutFill(props: SvgIconProps) {
  return <ProfileIcon {...props} style={{ margin: '0 11px 0 1px', fill: 'none' }} />;
}

export function Profile(props: SvgIconProps) {
  return <SvgIcon component={ProfileIconWithoutFill} inheritViewBox {...props} />;
}

function UnassignedIconWithoutFill(props: SvgIconProps) {
  return <UnassignedIcon fill="none" style={{ marginRight: '10px' }} {...props} />;
}

export function Unassigned(props: SvgIconProps) {
  return <SvgIcon component={UnassignedIconWithoutFill} inheritViewBox {...props} />;
}

function ShowHideWithoutFill(props: SvgIconProps) {
  return <ShowHideIcon style={{ fill: 'none' }} {...props} />;
}

export function ShowHide(props: SvgIconProps) {
  return <SvgIcon component={ShowHideWithoutFill} inheritViewBox {...props} />;
}

export function Plus(props: SvgIconProps) {
  return <SvgIcon component={PlusIcon} inheritViewBox {...props} />;
}

function TrashIconWithoutFill() {
  return <TrashIcon fill="none" />;
}

export function Trash(props: SvgIconProps) {
  return <SvgIcon component={TrashIconWithoutFill} {...props} />;
}
