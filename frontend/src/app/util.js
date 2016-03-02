import u from 'updeep';
import _ from 'lodash';


export function u_array_to_obj(key, items, extra = {}) {
    let obj = {};
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        obj[item[key]] = {...item, ...extra};
    }
    return obj;
}

export function u_one_or_more(state, payload, collection, id_name) {
  if (_.isArray(payload)) {
    return u({
      [collection]: u_array_to_obj(id_name, payload)
    }, state);
  } else {
    return u({
      [collection]: { [payload[id_name]]: payload }
    }, state);
  }
}

export function u_payload_to_field(field_name) {
  return (state, action) => u({[field_name]: action.payload}, state);
}
