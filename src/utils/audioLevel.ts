/** RMS below this threshold is treated as silence (paused video / no speech). */
const SILENCE_RMS_THRESHOLD = 0.008

export function isSilent(samples: Float32Array): boolean {
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  const rms = Math.sqrt(sum / samples.length)
  return rms < SILENCE_RMS_THRESHOLD
}
