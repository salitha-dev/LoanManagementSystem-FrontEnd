import React from 'react';
import showNotification from '../components/extras/showNotification';
import Icon from '../components/icon/Icon';
import { TIcons } from '../type/icons-type';

const notificationTitle = (icon: TIcons, text: string) => (
	<span className='d-flex align-items-center'>
		<Icon icon={icon} size='lg' className='me-1' />
		<span>{text}</span>
	</span>
);

export function showAppSuccess(title: string, message: string): void {
	showNotification(notificationTitle('CheckCircle', title), message, 'success');
}

export function showAppError(title: string, message: string): void {
	showNotification(notificationTitle('Error', title), message, 'danger');
}

export function showAppInfo(title: string, message: string): void {
	showNotification(notificationTitle('Info', title), message, 'info');
}
