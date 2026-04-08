FROM scratch

COPY anubis-files/bin /bin

ENTRYPOINT [ "/bin/anubis" ]
CMD [ "-bind", ":8923", "-metrics-bind", ":9090" ]
# HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=1 CMD [ "/bin/anubis", "-bind", ":8924", "-metrics-bind", ":9091", "-healthcheck" ]

EXPOSE 8923 9090
