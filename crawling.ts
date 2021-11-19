import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import cheerio from 'cheerio';
import { decode } from 'iconv-lite';
import { Model } from 'mongoose';

import { CreatePostDto } from '../posts/dto/create-post.dto';
import { Post, PostDocument } from '../posts/schemas/post.schema';

export class CrawlerService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async getHtml(url: string, encoding = null) {
    try {
      const response = await axios.get(url, { responseType: encoding });

      return response.data;
    } catch (error) {
      return error;
    }
  }

  async crawlingA(): Promise<any> {
    const URLArr = [];
    for (let index = 1; index < 3; index += 1) {
      URLArr.push(`https://quasarzone.com/bbs/qb_saleinfo?page=${index}`);
    }
    const temp = [];

    const promises = URLArr.map(async (url) => {
      const html = await this.getHtml(url);
      const $ = cheerio.load(html);
      $('a.subject-link').each((index, item) => {
        temp.push(item.attribs.href);
      });

      return temp;
    });
    const arr = await Promise.all(promises);

    const main = async (arr) => {
      const result = [];
      const promises = arr.map(async (url) => {
        const htmlDetail = await this.getHtml(`https://quasarzone.com/${url}`);
        const $ = await cheerio.load(htmlDetail);
        const content: CreatePostDto = {
          categori: '크롤링 알뜰정보',
          content: {
            title: $('title').text(),
            url: `https://quasarzone.com/${url}`,
            date: $(
              '#content > div.sub-content-wrap > div.left-con-wrap > div.common-view-wrap.market-info-view-wrap > div > dl > dt > div.util-area > p > span',
            ).text(),
            state: $(
              '#content > div.sub-content-wrap > div.left-con-wrap > div.common-view-wrap.market-info-view-wrap > div > dl > dt > h1 > span.label',
            ).text(),
            embeded: $(
              '#content > div.sub-content-wrap > div.left-con-wrap > div.common-view-wrap.market-info-view-wrap > div > dl > dd > table > tbody > tr:nth-child(1) > td > a',
            ).text(),
            image: $(
              '#content > div.sub-content-wrap > div.left-con-wrap > div.common-view-wrap.market-info-view-wrap > div > dl > dd > div.view-content > div > p:nth-child(1) > img',
            ).attr('src'),
          },
        };

        const post = await this.postModel.findOneAndUpdate(
          { 'content.title': content.content.title },
          content,
        );

        if (!post || !content.content.embeded) {
          const post = new this.postModel(content);
          await post.save();
        }
        result.push(post);
      });
      await Promise.all(promises);

      return result;
    };

    const htmlDetail = await this.getHtml(
      `https://quasarzone.com/${arr[0][3]}`,
    );
    const $ = await cheerio.load(htmlDetail);

    const post = await this.postModel.findOne({
      'content.title': $('title').text(),
    });

    if (!post) {
      return main(arr.flat());
    }

    return { message: 'already updated' };
  }

  async crawlingB(): Promise<any> {
    const URLArr = [];
    for (let index = 0; index < 2; index += 1) {
      URLArr.push(`https://m.clien.net/service/board/jirum?po=${index}`);
    }
    const temp = [];

    const promises = URLArr.map(async (url) => {
      const html = await this.getHtml(url);
      const $ = cheerio.load(html);
      $('a.list_subject').each((index, item) => {
        temp.push(item.attribs.href);
      });

      return temp;
    });
    let arr = await Promise.all(promises);

    arr = arr.flat().filter((url) => String(url).includes('/jirum/'));

    const main = async (arr) => {
      const result = [];
      const promises = arr.map(async (url) => {
        const htmldetail = await this.getHtml(`https://m.clien.net${url}`);
        const $ = await cheerio.load(htmldetail);
        const content = {
          categori: '크롤링 알뜰정보',
          content: {
            title: $('div.post_subject>span').text(),
            url: `https://m.clien.net${url}`,
            date: $('span.time').text()
              ? $('span.time').text()
              : $("[class*='fa']").text(),
            state: $('span.post_soldout').text(),
            embeded: $('a.url').text(),
            image: $('img').attr('src'),
          },
        };

        const post = await this.postModel.findOneAndUpdate(
          { 'content.title': content.content.title },
          content,
        );

        if (!post) {
          const post = new this.postModel(content);
          await post.save();
        }
        result.push(post);
      });
      await Promise.all(promises);

      return result;
    };

    const htmlDetail = await this.getHtml(`https://m.clien.net${arr[0]}`);
    const $ = await cheerio.load(htmlDetail);

    const post = await this.postModel.findOne({
      'content.title': $('div.post_subject>span').text(),
    });

    if (!post) {
      return main(arr);
    }

    return { message: 'already updated' };
  }

  async crawlingC(): Promise<any> {
    const URLArr = [];
    for (let index = 1; index < 3; index += 1) {
      URLArr.push(
        `https://m.ppomppu.co.kr/new/bbs_list.php?id=ppomppu&page=${index}`,
      );
    }
    const temp = [];

    const promises = URLArr.map(async (url) => {
      const html = await this.getHtml(url);
      const $ = cheerio.load(html);
      $('a.list_b_01n').each((index, item) => {
        temp.push(item.attribs.href);
      });

      return temp;
    });
    let arr = await Promise.all(promises);

    arr = arr.flat().filter((url) => !String(url).includes('/new/'));
    const main = async (arr) => {
      const result = [];
      const promises = arr.map(async (url, index) => {
        const htmldetail = await this.getHtml(
          `https://m.ppomppu.co.kr/new/${url}`,
          'arraybuffer',
        );

        const html = decode(htmldetail, 'euc-kr').toString();
        const $ = await cheerio.load(html);

        const content = {
          categori: '크롤링 알뜰정보',
          content: {
            title: $('meta[property="og:title"]').attr('content'),
            url: `https://m.ppomppu.co.kr/new/${url}`,
            date: $('span.hi').text().split('|')[1],
            state: !!$('div.ppomppu_done').text(),
            embeded: $('a.noeffect').attr('href'),
            image: $('image.zb_target_resize').attr('src'),
          },
        };

        const post = await this.postModel.findOneAndUpdate(
          { 'content.title': content.content.title },
          content,
        );

        if (!post) {
          const post = new this.postModel(content);
          await post.save();
        }
        result.push(post);
      });
      await Promise.all(promises);

      return result;
    };

    const htmlDetail = await this.getHtml(
      `https://m.ppomppu.co.kr/new/${arr[0]}`,
    );
    const $ = await cheerio.load(htmlDetail);

    const post = await this.postModel.findOne({
      'content.title': $('meta[property="og:title"]').attr('content'),
    });

    if (!post) {
      return main(arr);
    }

    return { message: 'already updated' };
  }

  async crawlingD(): Promise<any> {
    const URLArr = [];
    for (let index = 1; index < 2; index += 1) {
      URLArr.push(`https://eomisae.co.kr/index.php?mid=fs&page=${index}`);
    }
    const temp = [];
    const promises = URLArr.map(async (url) => {
      const html = await this.getHtml(url);
      const $ = cheerio.load(html);
      $('a.hx').each((index, item) => {
        temp.push(item.attribs.href);
      });

      return temp;
    });
    const arr = await Promise.all(promises);

    const main = async (arr) => {
      const result = [];
      const promises = arr.map(async (url, index) => {
        const htmldetail = await this.getHtml(url);
        const $ = await cheerio.load(htmldetail);

        const content = {
          categori: '크롤링 알뜰정보',
          content: {
            title: $(
              '#D_ > div._wrapper > div._hd.clear > div._section > h2 > a',
            ).text(),
            url,
            date: $(
              '#D_ > div._wrapper > div._hd.clear > div.btm_area.clear > span:nth-child(10)',
            ).text(),
            state: true,
            embeded: $('a.dis_func_link').attr('href')
              ? $('a.dis_func_link').attr('href')
              : $("a[target='_blank']").attr('href'),
            image: `http:${$('div.xe_content > p > img').attr('src')}`,
          },
        };

        const post = await this.postModel.findOneAndUpdate(
          { 'content.title': content.content.title },
          content,
        );

        if (!post) {
          const post = new this.postModel(content);
          await post.save();
        }
        result.push(post);
      });
      await Promise.all(promises);

      return result;
    };

    const htmlDetail = await this.getHtml(arr[0][0]);
    const $ = await cheerio.load(htmlDetail);

    const post = await this.postModel.findOne({
      'content.title': $(
        '#D_ > div._wrapper > div._hd.clear > div._section > h2 > a',
      ).text(),
    });

    if (!post) {
      return main(arr.flat());
    }

    return { message: 'already updated' };
  }

  async crawlingE(): Promise<any> {
    const URLArr = [];
    for (let index = 1; index < 3; index += 1) {
      URLArr.push(
        `http://www.dealbada.com/bbs/board.php?bo_table=deal_domestic&page=${index}`,
      );
    }
    const temp = [];
    const promises = URLArr.map(async (url) => {
      const html = await this.getHtml(url);
      const $ = cheerio.load(html);
      $('td.td_subject > a').each((index, item) => {
        temp.push(item.attribs.href);
      });

      return temp;
    });
    const arr = await Promise.all(promises);

    const main = async (arr) => {
      const result = [];
      const promises = arr.map(async (url, index) => {
        const htmldetail = await this.getHtml(url);
        const $ = await cheerio.load(htmldetail);

        const content = {
          categori: '크롤링 알뜰정보',
          content: {
            title: $('#bo_v_info > div:nth-child(2) > span:nth-child(1)')
              .text()
              .trim(),
            url,
            date: $('#bo_v_info > div:nth-child(2) > span:nth-child(7)').text(),
            state: !!$('div.close_noti').text(),
            embeded: $(
              '#bo_v_link > ul > li > span:nth-child(1) > a > strong',
            ).text(),
            image: $('div.bo_v_con > p > a > img').attr('src'),
          },
        };
        const post = await this.postModel.findOneAndUpdate(
          { 'content.title': content.content.title },
          content,
        );

        if (!post) {
          const post = new this.postModel(content);
          await post.save();
        }
        result.push(post);
      });
      await Promise.all(promises);

      return result;
    };

    const htmlDetail = await this.getHtml(arr[0][0]);
    const $ = await cheerio.load(htmlDetail);

    const post = await this.postModel.findOne({
      'content.title': $('#bo_v_info > div:nth-child(2) > span:nth-child(1)')
        .text()
        .trim(),
    });

    if (!post) {
      return main(arr.flat());
    }

    return { message: 'already updated' };
  }

  async crawlingF(): Promise<any> {
    const URLArr = [];
    for (let index = 1; index < 3; index += 1) {
      URLArr.push(
        `http://www.dealbada.com/bbs/board.php?bo_table=deal_oversea&page=${index}`,
      );
    }
    const temp = [];
    const promises = URLArr.map(async (url) => {
      const html = await this.getHtml(url);
      const $ = cheerio.load(html);
      $('td.td_subject > a').each((index, item) => {
        temp.push(item.attribs.href);
      });

      return temp;
    });
    const arr = await Promise.all(promises);

    const main = async (arr) => {
      const result = [];
      const promises = arr.map(async (url, index) => {
        const htmldetail = await this.getHtml(url);
        const $ = await cheerio.load(htmldetail);

        const content = {
          categori: '크롤링 알뜰정보',
          content: {
            title: $('#bo_v_info > div:nth-child(2) > span:nth-child(1)')
              .text()
              .trim(),
            url,
            date: $('#bo_v_info > div:nth-child(2) > span:nth-child(7)').text(),
            state: !!$('div.close_noti').text(),
            embeded: $(
              '#bo_v_link > ul > li > span:nth-child(1) > a > strong',
            ).text(),
            image: $('div.bo_v_con > p > a > img').attr('src'),
          },
        };
        const post = await this.postModel.findOneAndUpdate(
          { 'content.title': content.content.title },
          content,
        );

        if (!post) {
          const post = new this.postModel(content);
          await post.save();
        }
        result.push(post);
      });
      await Promise.all(promises);

      return result;
    };

    const htmlDetail = await this.getHtml(arr[0][0]);
    const $ = await cheerio.load(htmlDetail);

    const post = await this.postModel.findOne({
      'content.title': $('#bo_v_info > div:nth-child(2) > span:nth-child(1)')
        .text()
        .trim(),
    });

    if (!post) {
      return main(arr.flat());
    }

    return { message: 'already updated' };
  }

  async crawlingG(): Promise<any> {
    const URLArr = [];
    for (let index = 1; index < 3; index += 1) {
      URLArr.push(`https://coolenjoy.net/bbs/jirum/p${index}`);
    }
    const temp = [];
    const promises = URLArr.map(async (url) => {
      const html = await this.getHtml(url);
      const $ = cheerio.load(html);
      $('td.td_subject > a').each((index, item) => {
        temp.push(item.attribs.href);
      });

      return temp;
    });
    const arr = await Promise.all(promises);

    const main = async (arr) => {
      const result = [];
      const promises = arr.map(async (url, index) => {
        const htmldetail = await this.getHtml(url);
        const $ = await cheerio.load(htmldetail);

        const content = {
          categori: '크롤링 알뜰정보',
          content: {
            title: $("h1[id='bo_v_title']").text().trim(),
            url,
            date: $('#bo_v_info > strong:nth-child(4)').text(),
            state: true,
            embeded: $('#bo_v_link > ul > li > a > strong').text(),
            image: $('span.fr-img-wrap > a > img').attr('src'),
          },
        };

        const post = await this.postModel.findOneAndUpdate(
          { 'content.title': content.content.title },
          content,
        );

        if (!post) {
          const post = new this.postModel(content);
          await post.save();
        }
        result.push(post);
      });
      await Promise.all(promises);

      return result;
    };

    const htmlDetail = await this.getHtml(arr[0][0]);
    const $ = await cheerio.load(htmlDetail);

    const post = await this.postModel.findOne({
      'content.title': $("h1[id='bo_v_title']").text().trim(),
    });

    if (!post) {
      return main(arr.flat());
    }

    return { message: 'already updated' };
  }

  async crawlingH(): Promise<any> {
    const URLArr = [];
    for (let index = 1; index < 2; index += 1) {
      URLArr.push(`https://bbs.ruliweb.com/news/board/1020?page=${index}`);
    }
    const temp = [];
    const promises = URLArr.map(async (url) => {
      const html = await this.getHtml(url);
      const $ = cheerio.load(html);
      $('td.subject > a.deco').each((index, item) => {
        temp.push(item.attribs.href);
      });
      $('td.subject > div > a.deco').each((index, item) => {
        temp.push(item.attribs.href);
      });

      return temp;
    });
    const arr = await Promise.all(promises);

    const main = async (arr) => {
      const result = [];
      const promises = arr.map(async (url, index) => {
        const htmldetail = await this.getHtml(url);
        const $ = await cheerio.load(htmldetail);

        const content = {
          categori: '크롤링 알뜰정보',
          content: {
            title: $('span.subject_inner_text').text().trim(),
            url,
            date: $('span.regdate').text(),
            state: true,
            embeded: $(
              '#board_read > div > div.board_main > div.board_main_view > div.source_url > a',
            ).attr('href'),
            image: $('a.img_load > img').attr('src'),
          },
        };

        const post = await this.postModel.findOneAndUpdate(
          { 'content.title': content.content.title },
          content,
        );

        if (!post) {
          const post = new this.postModel(content);
          await post.save();
        }
        result.push(post);
      });
      await Promise.all(promises);

      return result;
    };

    const htmlDetail = await this.getHtml(arr[0][0]);
    const $ = await cheerio.load(htmlDetail);

    const post = await this.postModel.findOne({
      'content.title': $('span.subject_inner_text').text().trim(),
    });

    if (!post) {
      return main(arr.flat());
    }

    return { message: 'already updated' };
  }
}
