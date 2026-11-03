# Isolated transport-test fixtures

`web-pilot-test.key` and `web-pilot-test.crt` are deliberately public, self-signed test material generated for loopback HTTPS/WSS integration tests. They are not trusted by Windows, not a production credential and must never be used by the installed pilot. The real pilot generates a distinct certificate/key into ACL-protected machine state.

SSH test keys are generated in memory for each isolated SSH harness. Tests never contact the original VM and never use learner or operator credentials.
