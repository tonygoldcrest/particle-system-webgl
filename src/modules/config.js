export default class AppConfig {
	constructor(configuration) {
		this.values = {};
		this.configuration = configuration;

		Object.keys(configuration).forEach((key) => {
			Object.defineProperty(this.values, key, {
				configurable: true,
				enumerable: true,
				get() {
					return configuration[key].value;
				},
				set(newValue) {
					configuration[key].value = newValue;
				},
			});
		});

		this.configureGui(configuration);
	}

	configureGui(configuration) {
		this.gui = new dat.GUI();

		Object.keys(configuration)
			.sort(
				(k1, k2) =>
					!!configuration[k2].gui.order - !!configuration[k1].gui.order
			)
			.forEach((key) => {
				console.log(key);
				const value = configuration[key];
				let guiEntry;

				switch (value.gui.type) {
					case 'bool':
						guiEntry = this.gui.add(this.values, key);
						break;
					case 'range':
						guiEntry = this.gui.add(
							this.values,
							key,
							value.gui.from,
							value.gui.to
						);

						if (value.gui.step) {
							guiEntry.step(value.gui.step);
						}
						break;
					case 'color':
						guiEntry = this.gui.addColor(this.values, key);
						break;
					case 'list':
						guiEntry = this.gui.add(this.values, key, value.gui.listValues);
						break;
					default:
						console.error('Unsupported GUI type');
						break;
				}

				if (value.gui.onChange) {
					guiEntry[value.gui.onChangeFunc](value.gui.onChange);
				}

				if (value.gui.listen) {
					guiEntry.listen();
				}
			});
	}
}
