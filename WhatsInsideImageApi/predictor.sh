#!/bin/bash
/home/yousry/models/im2txt/bazel-bin/im2txt/run_inference --checkpoint_path="/home/yousry/model-data/model.ckpt-2000000" --vocab_file="/home/yousry/model-data/word_counts.txt" --input_files=$1
