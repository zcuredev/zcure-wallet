# Security Policy

## Supported Versions

This repository currently supports the latest published `0.x` version of
`@zcure/sdk`.

## Reporting a Vulnerability

Please report vulnerabilities privately to the project maintainers before public
disclosure. Include:

- affected package version or commit
- reproduction steps
- impact assessment
- any suggested mitigation

Do not include private keys, seed phrases, RPC credentials, or live wallet data
in reports.

## Threat Model

This SDK helps callers construct Solana transactions. It does not custody funds,
submit transactions automatically, or provide a complete privacy protocol.

In scope:

- local transaction construction
- compressed SOL transaction helper behavior
- one-time deposit address generation and sweep transaction construction
- dependency and build-chain hygiene

Out of scope:

- wallet adapter security
- RPC provider correctness or censorship resistance
- Light Protocol circuit, prover, indexer, or program correctness
- browser, extension, or mobile key storage
- chain-analysis resistance beyond what Light Protocol and the caller's
  application provide

## Key Handling

Spend keys are bearer secrets. Anyone with a spend key can sweep funds from the
corresponding one-time deposit address. Applications should store spend keys in
encrypted local storage, hardware-backed storage, or another user-controlled
secret store.

The current `StealthManager` API is an experimental one-time deposit address
helper. It should not be described as a full stealth-address protocol until the
project implements audited recipient scanning, encrypted announcements, and a
standard key-derivation design.
