import yaml
import argparse
import collections
from os import path

# Set default logging handler to avoid "No handler found" warnings.
import logging
import logging.config
try:  # Python 2.7+
    from logging import NullHandler
except ImportError:
    class NullHandler(logging.Handler):
        def emit(self, record):
            pass

logging.getLogger(__name__).addHandler(NullHandler())


class obj(argparse.Namespace):
    def __init__(self, d):
        for a, b in d.items():
            if isinstance(b, (list, tuple)):
                setattr(self, a, [obj(x) if isinstance(x, dict) else x for x in b])
            else:
                setattr(self, a, obj(b) if isinstance(b, dict) else b)


def update(d, u):
    for k, v in u.items():
        if isinstance(v, collections.Mapping):
            r = update(d.get(k, {}), v)
            d[k] = r
        else:
            d[k] = u[k]
    return d


def load_yaml(filename):
    parent = {}
    current = {}

    with open(filename, 'r') as f:
        current = yaml.load(f.read())

    if 'include' in current:
        base_dir = path.dirname(path.realpath(filename))
        parent_path = path.join(base_dir, current['include'])
        parent = load_yaml(parent_path)

    return update(parent, current)


def load(filename):
    cfg = load_yaml(filename)

    logging.config.dictConfig(cfg['logging'])

    return obj(cfg)
