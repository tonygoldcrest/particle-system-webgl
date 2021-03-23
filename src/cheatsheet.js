const hotkeysListEntries = [
	{
		hotkey: 'x',
		description: 'Explosion at the center of the screen',
	},
	{
		hotkey: 'X',
		description: 'Explosion at the current mouse position',
	},
	{
		hotkey: 'r',
		description: 'Respawn a filled circle of particles',
	},
	{
		hotkey: 'e',
		description: 'Respawn an empty circle of particles',
	},
	{
		hotkey: '1-9',
		description:
			'Spawn N invisible "heavy particles" that all particles will fly towards. All heavy particles will be located in the corners of a perfect N-shaped polygon. For example, pressing 4 will create a "square" at the center of the screen',
	},
	{
		hotkey: 'd',
		description: 'Delete all heavy particles',
	},
	{
		hotkey: 'c',
		description:
			'For the duration of the keypress drag all particles on the screen towards the center of the screen',
	},
	{
		hotkey: 'LMB',
		description:
			'(Left mouse button). Drags all particles towards the cursor for the duration of click',
	},
	{
		hotkey: 'p',
		description: 'Pause. Preserves motion blur for beautiful screenshots :)',
	},
	{
		hotkey: 's',
		description: 'Stops particles by setting their velocities to 0',
	},
];

window.addEventListener('load', () => {
	const cheatsheet = document.createElement('div');
	cheatsheet.classList.add('cheatsheet', 'cheatsheet--hidden');

	const toggleCheatsheetButton = document.createElement('button');
	toggleCheatsheetButton.textContent = 'Close cheatsheet';

	toggleCheatsheetButton.addEventListener('click', () => {
		if (cheatsheet.classList.contains('cheatsheet--hidden')) {
			cheatsheet.classList.remove('cheatsheet--hidden');
			toggleCheatsheetButton.textContent = 'Close cheatsheet';
		} else {
			cheatsheet.classList.add('cheatsheet--hidden');
			toggleCheatsheetButton.textContent = 'Open cheatsheet';
		}
	});

	cheatsheet.appendChild(toggleCheatsheetButton);

	const hotkeysList = document.createElement('div');
	hotkeysList.classList.add('cheatsheet__hotkeys-list');
	cheatsheet.appendChild(hotkeysList);

	hotkeysListEntries.forEach((entry) => {
		const hotkeyDiv = document.createElement('div');
		const descriptionDiv = document.createElement('div');
		const separatorDiv = document.createElement('div');

		hotkeyDiv.classList.add('cheatsheet__hotkey');
		descriptionDiv.classList.add('cheatsheet__description');
		separatorDiv.classList.add('cheatsheet__separator');

		hotkeyDiv.textContent = entry.hotkey;
		descriptionDiv.textContent = entry.description;

		hotkeysList.appendChild(hotkeyDiv);
		hotkeysList.appendChild(descriptionDiv);
		hotkeysList.appendChild(separatorDiv);
	});

	document.body.appendChild(cheatsheet);
});
