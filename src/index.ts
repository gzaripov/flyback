import Server from './server';
import { prepareOptions, UserOptions } from './options';

const talkback = (usrOpts: UserOptions) => {
  const opts = prepareOptions(usrOpts);

  return new Server(opts);
};

export default talkback;
