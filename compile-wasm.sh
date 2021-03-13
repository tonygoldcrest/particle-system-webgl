emcc -o src/wasm.js src/index.cpp -s WASM=1 \
  -s NO_EXIT_RUNTIME=0 -O3 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" \
  -s INITIAL_MEMORY=2000mb -s DISABLE_EXCEPTION_CATCHING=1
