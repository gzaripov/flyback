import { Options, createContext } from './context';
import { createServer } from './server';
import { createMiddleware } from './middleware';
import TapeAnalyzer from './tape-analyzer';

export default function create(options: Options) {
  const analyzer = new TapeAnalyzer();
  const context = createContext(options, { analyzer });
  const server = createServer(context);
  const middleware = createMiddleware(context);
  const getStatistics = analyzer.statistics.bind(analyzer);
  const printStatistics = analyzer.printStatistics.bind(analyzer);

  return {
    server,
    middleware,
    getStatistics,
    printStatistics,
  };
}
