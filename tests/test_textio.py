from tsl_validation.textio import read_text_auto


def test_read_text_auto_handles_gbk_source(tmp_path):
    source_file = tmp_path / "gbk_source.tsl"
    source_file.write_bytes('Function demo();\nBegin\n  return "中文";\nEnd;\n'.encode("gbk"))

    assert "中文" in read_text_auto(source_file)
