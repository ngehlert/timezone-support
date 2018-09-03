import { getUnixTimeFromUTC, getUTCTime, getLocalTime } from './utc-date'

function findTransitionIndex (unixTime, timeZone) {
  const { untils } = timeZone
  for (let i = 0, length = untils.length; i < length; ++i) {
    if (unixTime < untils[i]) {
      return i
    }
  }
}

function getTransition (unixTime, timeZone) {
  const transitionIndex = findTransitionIndex(unixTime, timeZone)
  const abbreviation = timeZone.abbreviations[transitionIndex]
  const offset = timeZone.offsets[transitionIndex]
  return { abbreviation, offset }
}

function attachEpoch (time, unixTime) {
  Object.defineProperty(time, 'epoch', { value: unixTime })
}

function setTimeZone (time, timeZone, options) {
  if (time instanceof Date) {
    const { useUTC } = options || {}
    let extract
    if (useUTC === true) {
      extract = getUTCTime
    } else if (useUTC === false) {
      extract = getLocalTime
    } else {
      throw new Error('Source of the date parts missing.')
    }
    time = extract(time)
  } else {
    const { year, month, day, hours, minutes, seconds = 0, milliseconds = 0 } = time
    time = { year, month, day, hours, minutes, seconds, milliseconds }
  }
  const unixTime = getUnixTimeFromUTC(time)
  const { abbreviation, offset } = getTransition(unixTime, timeZone)
  time.zone = { abbreviation, offset }
  attachEpoch(time, unixTime)
  return time
}

function getZonedTime (date, timeZone) {
  const gotUnixTime = typeof date === 'number'
  const unixTime = gotUnixTime ? date : date.valueOf()
  const { abbreviation, offset } = getTransition(unixTime, timeZone)
  if (gotUnixTime || offset) {
    date = new Date(unixTime - offset * 60000)
  }
  const time = getUTCTime(date)
  time.zone = { abbreviation, offset }
  attachEpoch(time, unixTime)
  return time
}

function getUnixTime (time, timeZone) {
  let { zone, epoch } = time
  if (epoch) {
    if (timeZone) {
      throw new Error('Both epoch and other time zone specified.')
    }
    return epoch
  }
  const unixTime = getUnixTimeFromUTC(time)
  if (zone) {
    if (timeZone) {
      throw new Error('Two time zones specified.')
    }
  } else {
    zone = getTransition(unixTime, timeZone)
  }
  return unixTime + zone.offset * 60000
}

export { setTimeZone, getZonedTime, getUnixTime }
