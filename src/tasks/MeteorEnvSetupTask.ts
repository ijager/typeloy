import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class MeteorEnvSetupTask extends SetupTask {
  public describe() : string {
    return 'Setting up environment for meteor application';
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
      vars: {
        appName: this.config.app.name,
        deployPrefix: this.deployPrefix
      }
    });
  }
}
