import React, { useState, useEffect } from "react";
import { fmFetch } from "fmw-utils";
import { SCHEMA_SCAN_SCRIPT, SAVE_CONFIG_SCRIPT } from "../../../constants";
import {
  ConfigFormWrapper,
  MiniPage,
  ConfigMenu,
  ConfigContent,
  ConfigMenuItem
} from "./utils";
import Control from "./Control";

import { buildDefaults } from "./utils";
import { useForm } from "react-hook-form/dist/react-hook-form.ie11";
import "./index.css";

export { MiniPage, ConfigMenu, ConfigContent, ConfigMenuItem, Control };

/*
Here we set up the FORM, and connect to the FileMaker Database to
get schema, and eventually save the Config to the DB.
*/
export default function Configurator(props) {
  const { AddonUUID, Config, children } = props;

  // STATE store the CONFIG
  const [newConfig, setNewConfig] = useState(Config);
  const [currentNav, setNav] = useState("required");
  const defaultValues = buildDefaults(newConfig);

  // FORM - useForm hook
  const {
    getValues,
    triggerValidation,
    register,
    errors,
    formState,
    handleSubmit,
    ...formObj
  } = useForm({
    defaultValues,
    mode: "onChange"
  });

  /**
   * ON CHANGE - we may scan schema again.
   * @param {O)N} e
   */
  const onChange = e => {
    const name = e.target.name;
    const obj = Config[name];
    if (obj && obj.reScanOnChange) {
      scanSchema();
    }
  };

  /**
   * SCANS THE DB FOR META DATA
   */
  async function scanSchema() {
    const currentFormValues = getValues();
    const config = JSON.parse(JSON.stringify(newConfig));
    //add current form state back to config
    Object.keys(config).forEach(key => {
      config[key].value = currentFormValues[key];
    });

    const result = await fmFetch(SCHEMA_SCAN_SCRIPT, config);

    setNewConfig(result);
    triggerValidation();
  }

  /**
   * SAVE THE CONFIG TO FM
   * @param {*} config
   */
  const onSaveConfig = async config => {
    await fmFetch(SAVE_CONFIG_SCRIPT, config);
  };

  useEffect(() => {
    scanSchema();
  }, [Config, AddonUUID]);

  ///

  function proper(name) {
    return { register, ...newConfig[name], name, onChange, errors };
  }
  const menuProps = { errors, onClick: link => setNav(link), currentNav };
  const submitDisabled = !formState.dirty || !formState.isValid;

  const onSubmit = handleSubmit(data => {
    const config = JSON.parse(JSON.stringify(newConfig));
    Object.keys(config).forEach(key => {
      config[key].value = data[key];
    });
    onSaveConfig(config);
  });

  return (
    <ConfigFormWrapper
      submitDisabled={submitDisabled}
      formState={formState}
      onSubmit={onSubmit}
    >
      {children(menuProps, currentNav, proper)}
    </ConfigFormWrapper>
  );
}
