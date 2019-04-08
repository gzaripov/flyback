import Server from './server';
import { Opts, UserOptions } from './options';

const talkback = (usrOpts: UserOptions) => {
  const opts = Opts.prepare(usrOpts);

  return new Server(opts);
};

export default talkback;
