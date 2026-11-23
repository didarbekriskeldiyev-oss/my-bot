import {Config} from '@remotion/cli/config';
// Use the Chromium already installed on this server
Config.setBrowserExecutable(process.env.REMOTION_CHROME ?? '/opt/pw-browsers/chromium');
Config.setChromiumOpenGlRenderer('swangle');
