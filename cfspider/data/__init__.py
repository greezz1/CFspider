"""
CFspider Data Processing Module
统一的数据处理模块，可独立使用或与爬虫集成
"""

from .dataframe import DataFrame
from .io import read, read_csv, read_json, read_excel

__all__ = [
    'DataFrame',
    'read',
    'read_csv',
    'read_json', 
    'read_excel',
]

