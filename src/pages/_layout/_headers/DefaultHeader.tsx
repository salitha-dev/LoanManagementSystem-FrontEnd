import React from 'react';
import Header, { HeaderLeft } from '../../../layout/Header/Header';
import Logo from '../../../components/Logo';
import CommonHeaderRight from './CommonHeaderRight';

const DefaultHeader = () => {
	return (
		<Header>
			<HeaderLeft>
				<div className='gps-header-brand'>
					<Logo variant='mark' size={38} showWordmark />
				</div>
			</HeaderLeft>
			<CommonHeaderRight />
		</Header>
	);
};

export default DefaultHeader;
