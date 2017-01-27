#!/bin/bash
/home/super/models/im2txt/bazel-bin/im2txt/run_inference --checkpoint_path="/home/super/model-data/model.ckpt-2000000" --vocab_file="/home/super/model-data/word_counts.txt" --input_files=$1
