const microsecondsPerMillisecond = 1000
const millisecondsPerSecond = 1000
const secondsPerMinute = 60
const minutesPerHour = 60
const hoursPerDay = 24
const microsecondsPerSecond = microsecondsPerMillisecond * millisecondsPerSecond
const microsecondsPerMinute = microsecondsPerSecond * secondsPerMinute
const microsecondsPerHour = microsecondsPerMinute * minutesPerHour
const microsecondsPerDay = microsecondsPerHour * hoursPerDay

const millisecondsPerMinute = millisecondsPerSecond * secondsPerMinute
const millisecondsPerHour = millisecondsPerMinute * minutesPerHour
const millisecondsPerDay = millisecondsPerHour * hoursPerDay
const secondsPerHour = secondsPerMinute * minutesPerHour
const secondsPerDay = secondsPerHour * hoursPerDay
const minutesPerDay = minutesPerHour * hoursPerDay

/**
 * A duration utility class that helps to convert between different time units.
 * inspired by Dart's Duration class.
 */
export class Duration {
  private durationMicroseconds = 0

  constructor({
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
    microseconds = 0,
  }: {
    days?: number
    hours?: number
    minutes?: number
    seconds?: number
    milliseconds?: number
    microseconds?: number
  } = {}) {
    this.durationMicroseconds =
      days * microsecondsPerDay +
      hours * microsecondsPerHour +
      minutes * microsecondsPerMinute +
      seconds * microsecondsPerSecond +
      milliseconds * microsecondsPerMillisecond +
      microseconds
  }

  /**
   * The number of entire days spanned by this Duration.
   */
  get inDays() {
    return Math.floor(this.durationMicroseconds / microsecondsPerDay)
  }

  /**
   * The number of entire hours spanned by this Duration.
   */
  get inHours() {
    return Math.floor(this.durationMicroseconds / microsecondsPerHour)
  }

  /**
   * The number of entire minutes spanned by this Duration.
   */
  get inMinutes() {
    return Math.floor(this.durationMicroseconds / microsecondsPerMinute)
  }

  /**
   * The number of entire seconds spanned by this Duration.
   */
  get inSeconds() {
    return Math.floor(this.durationMicroseconds / microsecondsPerSecond)
  }

  /**
   * The number of entire milliseconds spanned by this Duration.
   */
  get inMilliseconds() {
    return Math.floor(this.durationMicroseconds / microsecondsPerMillisecond)
  }

  /**
   * The number of microseconds spanned by this Duration.
   */
  get inMicroseconds() {
    return this.durationMicroseconds
  }

  static microsecondsPerMillisecond = microsecondsPerMillisecond
  static millisecondsPerSecond = millisecondsPerSecond
  static secondsPerMinute = secondsPerMinute
  static minutesPerHour = minutesPerHour
  static hoursPerDay = hoursPerDay
  static microsecondsPerSecond = microsecondsPerSecond
  static microsecondsPerMinute = microsecondsPerMinute
  static microsecondsPerHour = microsecondsPerHour
  static microsecondsPerDay = microsecondsPerDay
  static millisecondsPerMinute = millisecondsPerMinute
  static millisecondsPerHour = millisecondsPerHour
  static millisecondsPerDay = millisecondsPerDay
  static secondsPerHour = secondsPerHour
  static secondsPerDay = secondsPerDay
  static minutesPerDay = minutesPerDay
}
