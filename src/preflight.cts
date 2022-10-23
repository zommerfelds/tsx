import { constants as osConstants } from 'os';
import './suppress-warnings.cts';

// If a parent process is detected
if (process.send) {
	function relaySignal(signal: NodeJS.Signals) {
		process.send!({
			type: 'kill',
			signal,
		});

		/**
		 * Since we're setting a custom signal handler, we need to emulate the
		 * default behavior when there are no other handlers set
		 */
		if (process.listenerCount(signal) === 0) {
			// eslint-disable-next-line unicorn/no-process-exit
			process.exit(128 + osConstants.signals[signal]);
		}
	}

	const relaySignals = ['SIGINT', 'SIGTERM'] as const;
	for (const signal of relaySignals) {
		process.on(signal, relaySignal);
	}

	// Reduce the listenerCount to hide the one set above
	const { listenerCount } = process;
	process.listenerCount = function (eventName) {
		let count = Reflect.apply(listenerCount, this, arguments);
		if (relaySignals.includes(eventName as any)) {
			count -= 1;
		}
		return count;
	};
}