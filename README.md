# Symmetry-based WebGL Particle System

<img src="/images/video.gif" width="500"/>

A particle system capable of creating beautiful patterns due to the usage of symmetry.

## Demo
Check out the live demo [here](https://peancored.github.io/particle-system-webgl/)

WARNING: The link might not work when opened for the first time, simply reload the page and it should load correctly.

## How to use
1. Start with pressing `r` to generate a filled circle of particles
2. As they smoothly spread, press `x` to generate a powerful explosion in the middle of the screen
3. As particles hit the walls, press and hold `c` to start dragging them towards the middle of the screen
4. This should already create a beautiful imagery. Try playing with `x` and `c` more and different shapes will start emerging
5. Try pressing `r` followed by a number from 1 to 9 to create invisible "gravitational" enities that the particles will be attracted to
6. Follow this by pressing `x` repeatedly with some interval to combat the gravitational force, this should create even cooler patterns
7. You can find more hotkeys in the cheatsheet section of the demo
8. You can also configure various parameters using the config menu in the top right corner and take screenshots or load a background image using the buttons in the bottom right.

## Technologies Used
- **WebGL**: For rendering lots of particles with high performance.
- **WebAssembly (WASM)**: For physics calculations.

**Optimisation tips are more than welcome!**

## Example images

<img src="/images/screenshot3.jpg" width="500"/>

<img src="/images/screenshot1.jpg" width="500"/>

<img src="/images/screenshot2.jpg" width="500"/>

<img src="/images/screenshot4.jpg" width="500"/>
