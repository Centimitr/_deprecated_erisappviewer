export const time = {
  Second: 1000,
  Minute: 1000 * 60,
  Hour: 1000 * 60 * 60,
  Day: 1000 * 60 * 60 * 24,
  Now() {
    return Date.now();
  },
  Sleep(duration: number) {
    return new Promise(r => setTimeout(r, duration));
  },
  Since(time: number){
    return Date.now() - time;
  }
};
