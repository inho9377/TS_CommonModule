async function waitUntil(condition) {
    return await new Promise(resolve => {
        const interval = setInterval(() => {
            if (condition) {
                resolve('foo');
                clearInterval(interval);
            };
        }, 1000);
    });
}