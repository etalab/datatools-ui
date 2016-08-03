import along from 'turf-along'
import lineDistance from 'turf-line-distance'
import { latLngBounds } from 'leaflet'
import { extent } from 'turf-extent'

export const componentList = ['route', 'stop', 'fare', 'feedinfo', 'calendar', 'scheduleexception', 'agency']
export const subComponentList = ['trippattern']
export const subSubComponentList = ['timetable']

export const getEntityBounds = (entity, offset = 0.005) => {
  if (!entity) return null

  // [lng, lat]
  if (entity.constructor === Array) {
    return latLngBounds([[entity[1] + offset, entity[0] - offset], [entity[1] - offset, entity[0] + offset]])
  }
  // stop
  else if (typeof entity.stop_lat !== 'undefined') {
    return latLngBounds([[entity.stop_lat + offset, entity.stop_lon - offset], [entity.stop_lat - offset, entity.stop_lon + offset]])
  }
  // route
  else if (typeof entity.tripPatterns !== 'undefined') {
    let coordinates = []
    entity.tripPatterns.map(pattern => {
      if (pattern.shape.coordinates) {
        coordinates = [
          ...coordinates,
          ...pattern.shape.coordinates.map(c => ([c[1], c[0]]))
        ]
      }
    })
    return latLngBounds(coordinates)
  }
  // trip pattern
  else if (typeof entity.shape !== 'undefined') {
    return latLngBounds(entity.shape.coordinates.map(c => ([c[1], c[0]])))
  }
}

export const getEntityName = (component, entity) => {
  if (!entity) {
    return '[Unnamed]'
  }
  let entName = component === 'agency'
    ? 'agency_name'
    : component === 'route'
    ? 'route_short_name'
    : component === 'stop'
    ? 'stop_name'
    : component === 'calendar'
    ? 'description'
    : component === 'fare'
    ? 'fare_id'
    : component === 'scheduleexception'
    ? 'name'
    : null
  switch (component) {
    case 'stop':
      return entity.stop_name && entity.stop_code
        ? `${entity.stop_name} (${entity.stop_code})`
        : entity.stop_name && entity.stop_id
        ? `${entity.stop_name} (${entity.stop_id})`
        : entity.stop_name
    case 'route':
      return entity.route_short_name && entity.route_long_name && entity.route_short_name !== '""' && entity.route_long_name !== '""'
        ? `${entity.route_short_name} - ${entity.route_long_name}`
        : entity.route_short_name && entity.route_short_name !== '""'
        ? entity.route_short_name
        : entity.route_long_name && entity.route_long_name !== '""'
        ? entity.route_long_name
        : entity.route_id
    default:
      return entity[entName]
  }
}

export const gtfsIcons = [
  {
    id: 'feedinfo',
    icon: 'info',
    title: 'Edit feed info'
  },
  {
    id: 'agency',
    icon: 'building',
    title: 'Edit agencies'
  },
  {
    id: 'route',
    icon: 'bus',
    title: 'Edit routes'
  },
  {
    id: 'stop',
    icon: 'map-marker',
    title: 'Edit stops'
  },
  {
    id: 'calendar',
    icon: 'calendar',
    title: 'Edit calendars'
  },
  {
    id: 'fare',
    icon: 'ticket',
    title: 'Edit fares'
  }
]

export const getControlPoints = (pattern, snapToStops) => {
  if (!pattern) {
    return []
  }
  let controlPoints = []
  pattern.patternStops && pattern.patternStops.map((ps, index) => {
    // set distance to average of patternStop and next patternStop, if last stop set to end of segment
    let distance = pattern.patternStops[index + 1]
      ? (pattern.patternStops[index + 1].shapeDistTraveled + ps.shapeDistTraveled) / 2
      : lineDistance(pattern.shape, 'meters')
    let point = along(pattern.shape, distance, 'meters')
    let controlPoint = {
      point,
      distance: distance,
      permanent: true
    }
    let stopPoint = along(pattern.shape, ps.shapeDistTraveled, 'meters')
    let stopControl = {
      point: stopPoint,
      permanent: true,
      distance: ps.shapeDistTraveled,
      ...ps
    }
    if (snapToStops) {
      stopControl.hidden = true
    }
    controlPoints.push(stopControl)
    controlPoints.push(controlPoint)
  })
  return controlPoints
}