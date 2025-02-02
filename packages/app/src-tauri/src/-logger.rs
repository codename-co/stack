use log::{Level, LevelFilter, Metadata, Record, SetLoggerError};

struct SimpleLogger;

impl log::Log for SimpleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Debug
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            // match record.level(),
            match record.level() {
                Level::Debug => println!("\x1b[90m{}\x1b[0m", record.args()),
                Level::Info => println!("{}", record.args()),
                Level::Error => eprintln!("{}", record.args()),
                _ => eprintln!("{}", record.args()),
            }
        }
    }

    fn flush(&self) {}
}

// static LOGGER: SimpleLogger = SimpleLogger;

pub fn init() -> Result<(), SetLoggerError> {
    // log::set_logger(&LOGGER).map(|()| log::set_max_level(LevelFilter::Info))
    log::set_boxed_logger(Box::new(SimpleLogger)).map(|()| log::set_max_level(LevelFilter::Debug))
}
