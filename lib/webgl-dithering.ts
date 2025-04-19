// This file contains the WebGL implementation of the dithering algorithms

// WebGL shader code for the vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`

// WebGL shader code for the fragment shader (Floyd-Steinberg dithering)
const floydSteinbergShaderSource = `
  precision highp float;
  
  uniform sampler2D u_image;
  uniform float u_threshold;
  uniform float u_diffusionFactor;
  uniform int u_colorReduction;
  uniform bool u_serpentine;
  uniform float u_noiseAmount;
  uniform vec2 u_resolution;
  uniform bool u_showSplit;
  uniform float u_splitPosition;
  uniform bool u_temporalDithering;
  uniform float u_time;
  
  varying vec2 v_texCoord;
  
  // Pseudo-random function
  float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    // Add noise if needed
    if (u_noiseAmount > 0.0) {
      float noise = random(v_texCoord) * 2.0 - 1.0;
      color.rgb += noise * u_noiseAmount;
    }
    
    // Apply color reduction
    float factor = pow(2.0, float(u_colorReduction));
    vec3 reducedColor = floor(color.rgb * factor) / factor;
    
    // For the original side of the split view
    if (u_showSplit && v_texCoord.x < u_splitPosition) {
      gl_FragColor = vec4(reducedColor, color.a);
      return;
    }
    
    // Convert to grayscale for dithering
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Apply temporal dithering if enabled
    if (u_temporalDithering) {
      // Add a small time-based offset to the threshold to reduce flicker
      float timeOffset = sin(u_time * 0.1) * 0.02;
      float adjustedThreshold = u_threshold / 255.0 + timeOffset;
      
      // Apply threshold with temporal adjustment
      float dithered = gray > adjustedThreshold ? 1.0 : 0.0;
      gl_FragColor = vec4(vec3(dithered), color.a);
    } else {
      // Standard threshold
      float dithered = gray > u_threshold / 255.0 ? 1.0 : 0.0;
      gl_FragColor = vec4(vec3(dithered), color.a);
    }
  }
`

// WebGL shader code for the Bayer dithering algorithm
const bayerShaderSource = `
  precision highp float;
  
  uniform sampler2D u_image;
  uniform float u_threshold;
  uniform int u_matrixSize;
  uniform int u_colorReduction;
  uniform float u_noiseAmount;
  uniform vec2 u_resolution;
  uniform bool u_showSplit;
  uniform float u_splitPosition;
  uniform bool u_temporalDithering;
  uniform float u_time;
  
  varying vec2 v_texCoord;
  
  // Pseudo-random function
  float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // Simplified Bayer matrix lookup
  float getBayerValue(vec2 pixelCoord) {
    // 2x2 Bayer matrix
    mat2 bayer2x2 = mat2(
      0.0, 2.0,
      3.0, 1.0
    ) / 4.0;
    
    // Use the 2x2 matrix for all sizes for compatibility
    int x = int(mod(pixelCoord.x, 2.0));
    int y = int(mod(pixelCoord.y, 2.0));
    
    if (x == 0 && y == 0) return bayer2x2[0][0];
    if (x == 1 && y == 0) return bayer2x2[0][1];
    if (x == 0 && y == 1) return bayer2x2[1][0];
    return bayer2x2[1][1];
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    // Add noise if needed
    if (u_noiseAmount > 0.0) {
      float noise = random(v_texCoord) * 2.0 - 1.0;
      color.rgb += noise * u_noiseAmount;
    }
    
    // Apply color reduction
    float factor = pow(2.0, float(u_colorReduction));
    vec3 reducedColor = floor(color.rgb * factor) / factor;
    
    // For the original side of the split view
    if (u_showSplit && v_texCoord.x < u_splitPosition) {
      gl_FragColor = vec4(reducedColor, color.a);
      return;
    }
    
    // Get pixel coordinates
    vec2 pixelCoord = v_texCoord * u_resolution;
    
    // Apply temporal offset if enabled
    if (u_temporalDithering) {
      // Slightly offset the pixel coordinates based on time
      pixelCoord += vec2(sin(u_time * 0.2) * 0.5, cos(u_time * 0.2) * 0.5);
    }
    
    // Convert to grayscale
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Get Bayer threshold value
    float bayerValue = getBayerValue(pixelCoord);
    
    // Apply threshold with Bayer matrix
    float normalizedThreshold = u_threshold / 255.0;
    float dithered = gray > mix(0.0, 1.0, bayerValue + normalizedThreshold - 0.5) ? 1.0 : 0.0;
    
    gl_FragColor = vec4(vec3(dithered), color.a);
  }
`

// Initialize WebGL dithering
export function initWebGLDithering(canvas: HTMLCanvasElement) {
  // Get WebGL context
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })

  if (!gl) {
    console.error("WebGL not supported")
    return null
  }

  // Create shader programs
  const floydSteinbergProgram = createShaderProgram(gl, vertexShaderSource, floydSteinbergShaderSource)
  const bayerProgram = createShaderProgram(gl, vertexShaderSource, bayerShaderSource)

  // Check if shader programs were created successfully
  if (!floydSteinbergProgram || !bayerProgram) {
    console.error("Failed to create shader programs")
    return null
  }

  // Create buffers
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]), gl.STATIC_DRAW)

  const texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0]), gl.STATIC_DRAW)

  // Create texture
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  // Current settings
  let currentSettings = {
    algorithm: "floydSteinberg",
    threshold: 128,
    diffusionFactor: 0.75,
    matrixSize: 8,
    colorReduction: 8,
    serpentine: true,
    noiseAmount: 0,
    passes: 1,
    temporalDithering: true,
  }

  // Start time for animations
  const startTime = performance.now()

  // Set source texture
  function setSourceTexture(source: HTMLImageElement | HTMLVideoElement) {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)

    // Update canvas size
    canvas.width = source.width || (source as HTMLVideoElement).videoWidth
    canvas.height = source.height || (source as HTMLVideoElement).videoHeight
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  // Update settings
  function updateSettings(settings: any) {
    currentSettings = { ...currentSettings, ...settings }
  }

  // Render
  function render(splitPosition = 0.5, showSplit = true) {
    // Choose shader program based on algorithm
    let program
    if (
      currentSettings.algorithm === "bayer" ||
      currentSettings.algorithm === "ordered" ||
      currentSettings.algorithm === "clustered" ||
      currentSettings.algorithm === "halftone"
    ) {
      program = bayerProgram
    } else {
      program = floydSteinbergProgram
    }

    gl.useProgram(program)

    // Set up attributes
    const positionLocation = gl.getAttribLocation(program, "a_position")
    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord")

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.enableVertexAttribArray(texCoordLocation)
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

    // Set uniforms
    gl.uniform1f(gl.getUniformLocation(program, "u_threshold"), currentSettings.threshold)
    gl.uniform1i(gl.getUniformLocation(program, "u_colorReduction"), currentSettings.colorReduction)
    gl.uniform1f(gl.getUniformLocation(program, "u_noiseAmount"), currentSettings.noiseAmount)
    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height)
    gl.uniform1f(gl.getUniformLocation(program, "u_splitPosition"), splitPosition)
    gl.uniform1i(gl.getUniformLocation(program, "u_showSplit"), showSplit ? 1 : 0)
    gl.uniform1i(gl.getUniformLocation(program, "u_temporalDithering"), currentSettings.temporalDithering ? 1 : 0)
    gl.uniform1f(gl.getUniformLocation(program, "u_time"), (performance.now() - startTime) / 1000.0)

    // Algorithm-specific uniforms
    if (program === floydSteinbergProgram) {
      gl.uniform1f(gl.getUniformLocation(program, "u_diffusionFactor"), currentSettings.diffusionFactor)
      gl.uniform1i(gl.getUniformLocation(program, "u_serpentine"), currentSettings.serpentine ? 1 : 0)
    } else if (program === bayerProgram) {
      gl.uniform1i(gl.getUniformLocation(program, "u_matrixSize"), currentSettings.matrixSize)
    }

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  // Dispose resources
  function dispose() {
    gl.deleteProgram(floydSteinbergProgram)
    gl.deleteProgram(bayerProgram)
    gl.deleteBuffer(positionBuffer)
    gl.deleteBuffer(texCoordBuffer)
    gl.deleteTexture(texture)
  }

  return {
    setSourceTexture,
    updateSettings,
    render,
    dispose,
  }
}

// Helper function to create a shader program
function createShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource)

  // Check if shaders were created successfully
  if (!vertexShader || !fragmentShader) {
    console.error("Failed to create shaders")
    return null
  }

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Unable to initialize the shader program:", gl.getProgramInfoLog(program))
    return null
  }

  return program
}

// Helper function to create a shader
function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "An error occurred compiling the shaders:",
      gl.getShaderInfoLog(shader),
      "Shader type:",
      type === gl.VERTEX_SHADER ? "VERTEX_SHADER" : "FRAGMENT_SHADER",
      "Shader source:",
      source,
    )
    gl.deleteShader(shader)
    return null
  }

  return shader
}
