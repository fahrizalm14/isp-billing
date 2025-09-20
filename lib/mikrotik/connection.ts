export const runtime = "nodejs";

import { NodeSSH } from "node-ssh";
import { MikroTikConfig } from "./type";

export const tesConnection = async ({
  host,
  username,
  password,
  port = 22,
}: MikroTikConfig) => {
  const ssh = new NodeSSH();
  await ssh.connect({
    host,
    username,
    password,
    port,
    tryKeyboard: true,
  });

  ssh.dispose();
};

export const getPools = async ({
  host,
  username,
  password,
  port = 22,
}: MikroTikConfig) => {
  const ssh = new NodeSSH();
  await ssh.connect({
    host,
    username,
    password,
    port,
  });

  // Ambil pools
  const poolResult = await ssh.execCommand(
    `/ip pool print detail without-paging`
  );

  // Ambil assigned IPs
  const ipResult = await ssh.execCommand(
    `/ip address print detail without-paging`
  );

  ssh.dispose();

  return {
    poolResult,
    ipResult,
  };
};

export const getBandwidth = async ({
  host,
  username,
  password,
  port = 22,
  params = "",
}: MikroTikConfig) => {
  const ssh = new NodeSSH();
  await ssh.connect({
    host,
    username,
    password,
    port,
  });

  const result = await ssh.execCommand(
    `/interface monitor-traffic interface=${params} once`
  );

  ssh.dispose();

  return result;
};

export const getInterface = async ({
  host,
  username,
  password,
  port = 22,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params = "",
}: MikroTikConfig) => {
  const ssh = new NodeSSH();
  await ssh.connect({
    host,
    username,
    password,
    port,
  });

  const result = await ssh.execCommand(
    "/interface print detail without-paging"
  );
  ssh.dispose();

  return result;
};
