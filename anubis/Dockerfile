FROM scratch

COPY anubis-files/bin /bin

ENTRYPOINT [ "/bin/anubis" ]
CMD [ "-bind", ":8923", "-metrics-bind", ":9090" ]
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=1 CMD [ "-healthcheck" ]

EXPOSE 8923 9090
