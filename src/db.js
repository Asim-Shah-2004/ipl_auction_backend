import { connect } from 'mongoose';

export function dbConnect(uri) {
  return connect(uri);
}
