import {
	createShader,
	createProgram,
	resizeCanvasToDisplaySize,
	hexToRgb,
} from './helpers.js';
import { Vector2 } from './classes.js';
import AppConfig from './modules/config.js';

let particlesCoordinates;
let particleProgram;
let positionBuffer;
let triangleProgram;
let particlePositionAttributeLocation;
let trianglePositionAttributeLocation;
let pointSizeLocation;
let particleColorLocation;
let coefficientsLocation;
let particleOpacityLocation;
let backgroundColorLocation;
let readFromTextureLocation;
let particlesVao;
let trianglesVao;

const config = new AppConfig({
	particlesNum: {
		value: 1000000,
		gui: {
			type: 'range',
			from: 1,
			to: 1000000,
			listen: true,
			onChange: (newValue) => {
				createParticles(newValue);
			},
			onChangeFunc: 'onFinishChange',
		},
	},
	bounceX: {
		value: true,
		gui: {
			type: 'bool',
		},
	},
	bounceY: {
		value: true,
		gui: {
			type: 'bool',
		},
	},
	image: {
		value: false,
		gui: {
			type: 'bool',
			onChange: (newValue) => {
				gl.useProgram(particleProgram);
				gl.uniform1f(readFromTextureLocation, newValue ? 1 : 0);
			},
			onChangeFunc: 'onChange',
		},
	},
	party: {
		value: false,
		gui: {
			type: 'bool',
			onChange: (newValue) => {
				if (!newValue) {
					gl.uniform3f(coefficientsLocation, 1, 1, 1);
				}
			},
			onChangeFunc: 'onChange',
		},
	},
	squared: {
		value: true,
		gui: {
			type: 'bool',
		},
	},
	enableMotionBlur: {
		value: true,
		gui: {
			type: 'bool',
			onChange: (newValue) => {
				if (newValue) {
					clearColors(config.values.particleColor);
				}
			},
			onChangeFunc: 'onChange',
		},
	},
	particleSize: {
		value: 2,
		gui: {
			type: 'range',
			from: 1,
			to: 100,
			step: 1,
			onChange: (newValue) => {
				gl.uniform1f(pointSizeLocation, newValue);
			},
			onChangeFunc: 'onChange',
		},
	},
	spawnRadius: {
		value: 200,
		gui: {
			type: 'range',
			from: 20,
			to: 500,
		},
	},
	particleOpacity: {
		value: 0.5,
		gui: {
			type: 'range',
			from: 0,
			to: 1,
			step: 0.01,
			onChange: (newValue) => {
				gl.uniform1f(particleOpacityLocation, newValue);
			},
			onChangeFunc: 'onChange',
		},
	},
	'GPU Performance': {
		value: 1000000,
		gui: {
			order: 1,
			type: 'list',
			listValues: {
				UltraLow: 1000,
				SuperLow: 4000,
				VeryLow: 7000,
				Low: 10000,
				Medium: 50000,
				High: 100000,
				VeryHigh: 500000,
				Ultra: 1000000,
				Mega: 2000000,
				Duper: 3000000,
				Nightmare: 4000000,
				UltraNightmare: 5000000,
			},
			onChange: (newValue) => {
				config.values.particlesNum = newValue;

				createParticles(newValue);
			},
			onChangeFunc: 'onFinishChange',
		},
	},
	particleColor: {
		value: '#1e272e',
		gui: {
			type: 'color',
			onChange: (newValue) => {
				const particleColorRgb = hexToRgb(newValue);
				gl.useProgram(particleProgram);
				gl.uniform3f(
					particleColorLocation,
					particleColorRgb.r,
					particleColorRgb.g,
					particleColorRgb.b
				);
				clearColors(newValue);
			},
			onChangeFunc: 'onChange',
		},
	},
	backgroundColor: {
		value: '#ecf0f1',
		gui: {
			type: 'color',
			onChange: (newValue) => {
				const backgroundColorRgb = hexToRgb(newValue);
				gl.useProgram(triangleProgram);
				gl.uniform3f(
					backgroundColorLocation,
					backgroundColorRgb.r,
					backgroundColorRgb.g,
					backgroundColorRgb.b
				);

				clearColors(config.values.particleColor);
			},
			onChangeFunc: 'onChange',
		},
	},
});

let { particlesNum } = config.values;

const canvas = document.querySelector('#canvas');

/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext('webgl2', {
	preserveDrawingBuffer: config.values.enableMotionBlur,
});

function createParticles(number) {
	Module.ccall(
		'createParticles',
		null,
		['number', 'number', 'number', 'number', 'number'],
		[
			number,
			gl.canvas.width / 2,
			gl.canvas.height / 2,
			config.values.spawnRadius,
			0.01,
		]
	);

	particlesCoordinates = new Float32Array(2 * number);
	particlesNum = number;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// prettier-ignore
const triangles = new Float32Array(
	[
		-1, -1,
		-1, 1,
		1, 1,
		1, 1,
		1, -1,
		-1, -1
	]
);

function drawTriangles() {
	gl.useProgram(triangleProgram);

	gl.bindVertexArray(trianglesVao);

	gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);

	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function clearColors(color) {
	const colorRgb = hexToRgb(color);
	gl.clearColor(colorRgb.r, colorRgb.g, colorRgb.b, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	for (let i = 0; i < 40; i++) {
		drawTriangles();
	}
}

function setupGl() {
	positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	// Enable particles transparency
	// gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
	// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.blendFuncSeparate(
		gl.SRC_ALPHA,
		gl.ONE_MINUS_SRC_ALPHA,
		gl.ONE,
		gl.ONE_MINUS_SRC_ALPHA
	);
	gl.enable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);

	resizeCanvasToDisplaySize(gl.canvas, 2);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

async function setupParticleProgram() {
	const particleVertexShaderSource = await fetch(
		'./src/shaders/particle.vertex.glsl'
	).then((response) => response.text());
	const particleFragmentShaderSource = await fetch(
		'./src/shaders/particle.fragment.glsl'
	).then((response) => response.text());

	const particleVertexShader = createShader(
		gl,
		gl.VERTEX_SHADER,
		particleVertexShaderSource
	);
	const particleFragmentShader = createShader(
		gl,
		gl.FRAGMENT_SHADER,
		particleFragmentShaderSource
	);

	particleProgram = createProgram(
		gl,
		particleVertexShader,
		particleFragmentShader
	);

	pointSizeLocation = gl.getUniformLocation(particleProgram, 'uPointSize');
	readFromTextureLocation = gl.getUniformLocation(
		particleProgram,
		'uReadFromTexture'
	);
	coefficientsLocation = gl.getUniformLocation(
		particleProgram,
		'uCoefficients'
	);
	particleOpacityLocation = gl.getUniformLocation(particleProgram, 'uOpacity');
	particleColorLocation = gl.getUniformLocation(particleProgram, 'uColor');

	particlesVao = gl.createVertexArray();

	gl.bindVertexArray(particlesVao);

	particlePositionAttributeLocation = gl.getAttribLocation(
		particleProgram,
		'aPosition'
	);

	gl.enableVertexAttribArray(particlePositionAttributeLocation);

	gl.vertexAttribPointer(
		particlePositionAttributeLocation,
		2 /* size */,
		gl.FLOAT /* type */,
		false /* normalize */,
		2 * Float32Array.BYTES_PER_ELEMENT /* stride */,
		0 /* offset */
	);

	gl.useProgram(particleProgram);

	gl.uniform1f(pointSizeLocation, config.values.particleSize);
	gl.uniform1f(particleOpacityLocation, config.values.particleOpacity);

	const particleColorRgb = hexToRgb(config.values.particleColor);
	gl.uniform3f(
		particleColorLocation,
		particleColorRgb.r,
		particleColorRgb.g,
		particleColorRgb.b
	);

	gl.uniform3f(coefficientsLocation, 1, 1, 1);
}

function loadImage(image) {
	gl.useProgram(particleProgram);
	const imageLocation = gl.getUniformLocation(particleProgram, 'uImage');

	const texture = gl.createTexture();

	// make unit 0 the active texture uint
	// (ie, the unit all other texture commands will affect
	gl.activeTexture(gl.TEXTURE0 + 0);

	// Bind it to texture unit 0' 2D bind point
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Set the parameters so we don't need mips and so we're not filtering
	// and we don't repeat at the edges
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	// Upload the image into the texture.
	const mipLevel = 0; // the largest mip
	const internalFormat = gl.RGBA; // format we want in the texture
	const srcFormat = gl.RGBA; // format of data we are supplying
	const srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
	gl.texImage2D(
		gl.TEXTURE_2D,
		mipLevel,
		internalFormat,
		srcFormat,
		srcType,
		image
	);

	// Tell the shader to get the texture from texture unit 0
	gl.uniform1i(imageLocation, 0);
}

async function setupTriangleProgram() {
	const triangleVertexShaderSource = await fetch(
		'./src/shaders/triangle.vertex.glsl'
	).then((response) => response.text());
	const triangleFragmentShaderSource = await fetch(
		'./src/shaders/triangle.fragment.glsl'
	).then((response) => response.text());

	const triangleVertexShader = createShader(
		gl,
		gl.VERTEX_SHADER,
		triangleVertexShaderSource
	);
	const triangleFragmentShader = createShader(
		gl,
		gl.FRAGMENT_SHADER,
		triangleFragmentShaderSource
	);

	triangleProgram = createProgram(
		gl,
		triangleVertexShader,
		triangleFragmentShader
	);
	gl.useProgram(triangleProgram);

	trianglesVao = gl.createVertexArray();
	gl.bindVertexArray(trianglesVao);

	backgroundColorLocation = gl.getUniformLocation(
		triangleProgram,
		'uBackground'
	);
	trianglePositionAttributeLocation = gl.getAttribLocation(
		triangleProgram,
		'aPosition'
	);

	gl.vertexAttribPointer(
		trianglePositionAttributeLocation,
		2,
		gl.FLOAT,
		false,
		0,
		0
	);

	gl.enableVertexAttribArray(trianglePositionAttributeLocation);

	const backgroundColorRgb = hexToRgb(config.values.backgroundColor);
	gl.uniform3f(
		backgroundColorLocation,
		backgroundColorRgb.r,
		backgroundColorRgb.g,
		backgroundColorRgb.b
	);
}

async function main() {
	setupGl();
	await setupParticleProgram();

	if (config.values.enableMotionBlur) {
		await setupTriangleProgram();
	}

	const stats = new Stats();
	stats.showPanel(0);
	document.body.appendChild(stats.dom);

	let isMouseDown = false;
	let isForceApplied = false;
	let mouseDownPosition = new Vector2(
		gl.canvas.width / 2,
		gl.canvas.height / 2
	);
	let forceCenter = new Vector2(0, 0);
	let isPaused = false;

	let startTime = Date.now();

	createParticles(particlesNum);

	const canvasWidth = gl.canvas.width;
	const canvasHeight = gl.canvas.height;

	canvas.addEventListener('mousedown', (evt) => {
		isMouseDown = true;
		mouseDownPosition = new Vector2(
			gl.canvas.width * (evt.x / canvas.clientWidth),
			gl.canvas.height - gl.canvas.height * (evt.y / canvas.clientHeight)
		);
		forceCenter = mouseDownPosition;
		isForceApplied = true;
	});

	canvas.addEventListener('mousemove', (evt) => {
		mouseDownPosition = new Vector2(
			gl.canvas.width * (evt.x / canvas.clientWidth),
			gl.canvas.height - gl.canvas.height * (evt.y / canvas.clientHeight)
		);

		if (isMouseDown) {
			forceCenter = mouseDownPosition;
		}
	});

	document.addEventListener('mouseup', () => {
		isMouseDown = false;
		isForceApplied = false;
	});

	document.addEventListener('keydown', (evt) => {
		if (document.activeElement.getAttribute('type') === 'text') {
			return;
		}

		if (evt.key === 'c') {
			if (!isForceApplied) {
				forceCenter = new Vector2(gl.canvas.width / 2, gl.canvas.height / 2);
				isForceApplied = true;
			}
		} else if (evt.key === 'X') {
			Module.ccall(
				'explosion',
				null,
				['number', 'number', 'number'],
				[mouseDownPosition.x, mouseDownPosition.y, 5]
			);
		} else if (evt.key === 'x') {
			Module.ccall(
				'explosion',
				null,
				['number', 'number', 'number'],
				[gl.canvas.width / 2, gl.canvas.height / 2, 5]
			);
		} else if (evt.key === 'r') {
			Module.ccall(
				'respawn',
				null,
				['number', 'number', 'number', 'number'],
				[
					gl.canvas.width / 2,
					gl.canvas.height / 2,
					config.values.spawnRadius,
					0.01,
				]
			);
		} else if (evt.key === 'e') {
			Module.ccall(
				'spawnEmpty',
				null,
				['number', 'number', 'number', 'number', 'number'],
				[
					gl.canvas.width / 2,
					gl.canvas.height / 2,
					config.values.spawnRadius,
					10,
					5,
				]
			);
		} else if (evt.key === 's') {
			Module.ccall('stop', null, null, null);
		} else if (evt.key === 'p') {
			isPaused = !isPaused;

			if (!isPaused) {
				requestAnimationFrame(animate);
			}
		} else if (evt.key === 'd') {
			Module.ccall('deleteHeavyParticles', null, null, null);
		} else if (parseInt(evt.key)) {
			Module.ccall(
				'createHeavyParticles',
				null,
				['number', 'number', 'number'],
				[parseInt(evt.key), gl.canvas.width, gl.canvas.height]
			);
		}
	});

	document.addEventListener('keyup', (evt) => {
		if (document.activeElement.getAttribute('type') === 'text') {
			return;
		}

		if (evt.key === 'c') {
			isForceApplied = false;
		}
	});

	if (config.values.enableMotionBlur) {
		clearColors(config.values.particleColor);
	}

	requestAnimationFrame(animate);

	function animate() {
		stats.begin();
		let deltaTime = (Date.now() - startTime) / 1000;
		if (deltaTime === 0) {
			deltaTime = 0.001;
		}
		if (deltaTime > 1 / 6) {
			deltaTime = 1 / 60;
		}
		startTime = Date.now();

		if (config.values.enableMotionBlur) {
			drawTriangles();

			gl.useProgram(particleProgram);
		} else {
			const backgroundColorRgb = hexToRgb(config.values.backgroundColor);
			gl.clearColor(
				backgroundColorRgb.r,
				backgroundColorRgb.g,
				backgroundColorRgb.b,
				1.0
			);
			gl.clear(gl.COLOR_BUFFER_BIT);
		}

		ccallArrays(
			'calcCoordinates',
			'array',
			[
				'number',
				'number',
				'number',
				'number',
				'number',
				'number',
				'number',
				'number',
				'number',
				'number',
			],
			[
				canvasWidth,
				canvasHeight,
				config.values.particleSize,
				isForceApplied ? 1 : 0,
				forceCenter.x,
				forceCenter.y,
				deltaTime,
				config.values.bounceX ? 1 : 0,
				config.values.bounceY ? 1 : 0,
				config.values.squared ? 1 : 0,
			],
			{
				heapOut: 'HEAPF32',
				returnArraySize: particlesNum * 2,
				resultArray: particlesCoordinates,
			}
		);

		if (config.values.enableMotionBlur) {
			gl.bindVertexArray(particlesVao);
		}

		gl.bufferData(gl.ARRAY_BUFFER, particlesCoordinates, gl.DYNAMIC_DRAW);

		gl.drawArrays(
			gl.POINTS,
			0 /* offset */,
			particlesNum /* call shader times */
		);

		if (config.values.party) {
			gl.uniform3f(
				coefficientsLocation,
				(Math.sin(Date.now() / 250) + 1) / 4 + 1 / 4,
				(Math.sin(Date.now() / 250 + Math.PI) + 1) / 4 + 1 / 4,
				(Math.sin(Date.now() / 250 - Math.PI / 2) + 1) / 4 + 1 / 4
			);
		}

		stats.end();

		if (!isPaused) {
			requestAnimationFrame(animate);
		}
	}
}

const imageLoader = document.getElementById('upload-image');
imageLoader.addEventListener('change', handleImage, false);

function handleImage(e) {
	const reader = new FileReader();
	reader.onload = function (event) {
		const img = new Image();
		img.onload = function () {
			loadImage(img);
		};
		img.src = event.target.result;
	};
	reader.readAsDataURL(e.target.files[0]);
}

Module.onRuntimeInitialized = function () {
	main();
};
