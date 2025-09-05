/** @type {import('tailwindcss').Config} */
module.exports = {
	theme: {
		extend: {
			colors: {
				primary: {
					1: "#E0EDF5",
					2: "#C5DEEC",
					3: "#9BC5DF",
					4: "#65A6CD",
					5: "#3E90C1",
					6: "#3882AE",
					7: "#2B6587",
					8: "#193A4D",
					9: "#102430",
				},
				neutral: {
					0: "#FFFFFF",
					1: "#F5F5F5",
					2: "#E9EAEC",
					3: "#B7BBC2",
					4: "#9197A1",
					5: "#757D8A",
					6: "#69717C",
					7: "#525861",
					8: "#2F3237",
					9: "#1D1F23",
					10: "#000000",
				},
				green: {
					1: "#E3F1E0",
					2: "#CBE5C5",
					3: "#A6D29B",
					4: "#75BA65",
					5: "#53A93F",
					6: "#4B9839",
					7: "#3A762C",
					8: "#214419",
					9: "#152A10",
				},
				red: {
					1: "#FDE6E3",
					2: "#FBD0CA",
					3: "#F8AEA3",
					4: "#F48272",
					5: "#F1634F",
					6: "#D95947",
					7: "#A94537",
					8: "#602820",
					9: "#3C1914",
				},
				orange: {
					1: "#FEEBDD",
					2: "#FCDABF",
					3: "#FABF90",
					4: "#F89D54",
					5: "#F68429",
					6: "#DD7725",
					7: "#AC5C1D",
					8: "#623510",
					9: "#3E210A",
				},
				yellow: {
					1: "#FBF3D7",
					2: "#F7E9B4",
					3: "#F0D97D",
					4: "#E9C437",
					5: "#E3B505",
					6: "#CCA305",
					7: "#9F7F04",
					8: "#5B4802",
					9: "#392D01",
				},
				// red-6
				errored: "#D95947",
			},
			borderColor: (theme) => ({
				...theme("colors"),
			}),
			fontSize: {
				// fontName: [fontSize, lineHeight]
				"heading-1": ["48px", "56px"],
				"heading-2": ["40px", "48px"],
				"heading-3": ["32px", "40px"],
				"heading-4": ["28px", "40px"],
				"heading-5": ["24px", "32px"],
				"sub-heading": ["20px", "32px"],
				"paragraph-1": ["18px", "24px"],
				"paragraph-2": ["16px", "24px"],
				"paragraph-3": ["14px", "16px"],
				caption: ["12px", "16px"],
				"extra-small": ["10px", "12px"],
			},
			fontWeight: {
				light: "300",
				regular: "400",
				"semi-bold": "600",
				bold: "700",
				black: "900",
			},
			spacing: {
				px: "1px",
				0: "0",
				0.5: "2px",
				1: "4px",
				1.5: "6px",
				2: "8px",
				2.5: "10px",
				3: "12px",
				3.5: "14px",
				4: "16px",
				5: "20px",
				6: "24px",
				7: "28px",
				8: "32px",
				9: "36px",
				10: "40px",
				11: "44px",
				12: "48px",
				14: "56px",
				16: "64px",
				20: "80px",
				24: "96px",
				28: "112px",
				32: "128px",
				36: "144px",
				40: "160px",
				44: "176px",
				48: "192px",
				52: "208px",
				56: "224px",
				60: "240px",
				64: "256px",
				72: "288px",
				80: "320px",
				96: "384px",
			},
			borderRadius: (theme) => {
				const spacing = theme("spacing");
				const borderRadius = {};

				// Generate borderRadius values based on spacing scale
				Object.keys(spacing).forEach((key) => {
					borderRadius[key] = spacing[key];
				});

				return borderRadius;
			},
			opacity: {
				disabled: "0.38",
			},
		},
	},
	plugins: [
		require("tailwindcss-animate"),
		function ({ addUtilities }) {
			const newUtilities = {};
			const generateLineClamp = (lines) => ({
				overflow: "hidden",
				display: "-webkit-box",
				"-webkit-box-orient": "vertical",
				"-webkit-line-clamp": lines.toString(),
			});

			// Generate py special line-clamp utilities for 1 to 6 lines
			for (let i = 1; i <= 6; i++) {
				newUtilities[`.py-line-clamp-${i}`] = generateLineClamp(i);
			}
			addUtilities(newUtilities);
		},
	],
};
