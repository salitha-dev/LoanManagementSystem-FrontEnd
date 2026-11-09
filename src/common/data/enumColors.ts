export interface IColor {
	name: string;
	code: string;
}

const COLORS: Record<string, IColor> = {
	PRIMARY: { name: 'Primary', code: '#0f766e' },
	SECONDARY: { name: 'Secondary', code: '#64748b' },
	SUCCESS: { name: 'Success', code: '#059669' },
	INFO: { name: 'Info', code: '#0284c7' },
	WARNING: { name: 'Warning', code: '#d97706' },
	DANGER: { name: 'Danger', code: '#dc2626' },
	DARK: { name: 'Dark', code: '#0b1220' },
	LIGHT: { name: 'Light', code: '#f0f4f3' },
};

export default COLORS;
